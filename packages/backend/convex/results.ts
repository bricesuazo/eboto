import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { internalMutation, internalQuery, query } from './_generated/server';
import { requireCommissioner } from './_helpers/auth';
import { isElectionInProgress } from './_helpers/election_timing';
import {
  FREE_RESULTS_LATENCY_MS,
  freeTierResultsCutoff,
  isFreeTier,
} from './_helpers/billing';

/**
 * Live election tally. Candidates are anonymized as `Candidate N` while the
 * election is ongoing unless:
 *   - the viewer is a commissioner of this election, OR
 *   - `isCandidatesVisibleInRealtimeWhenOngoing` is true on the election.
 *
 * Convex queries are reactive; clients automatically re-render as votes land.
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const election = await ctx.db
      .query('elections')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();

    if (!election) return null;

    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    let isCommissioner = false;
    if (userId) {
      const commissioner = await ctx.db
        .query('commissioners')
        .withIndex('by_user_election', (q) =>
          q.eq('userId', userId).eq('electionId', election._id),
        )
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .first();
      isCommissioner = Boolean(commissioner);
    }

    // VOTER-publicity results are gated on participation: voters can only see
    // tallies once they've cast a ballot. Commissioners can still reach the
    // page without voting, but they see the same throttled tally as voters.
    if (election.publicity === 'VOTER' && !isCommissioner) {
      let hasVoted = false;
      const userEmail = user?.email;
      if (userEmail) {
        const voter = await ctx.db
          .query('voters')
          .withIndex('by_election_email', (q) =>
            q.eq('electionId', election._id).eq('email', userEmail),
          )
          .filter((q) => q.eq(q.field('deletedAt'), undefined))
          .first();
        if (voter) {
          const existingVote = await ctx.db
            .query('votes')
            .withIndex('by_election_voter', (q) =>
              q.eq('electionId', election._id).eq('voterId', voter._id),
            )
            .first();
          hasVoted = Boolean(existingVote);
        }
      }
      if (!hasVoted) {
        throw new ConvexError({
          code: 'forbidden',
          message: 'Cast your ballot to view results',
        });
      }
    }

    const positions = await ctx.db
      .query('positions')
      .withIndex('by_deleted_election', (q) =>
        q.eq('deletedAt', undefined).eq('electionId', election._id),
      )
      .collect();

    const candidates = await ctx.db
      .query('candidates')
      .withIndex('by_election', (q) => q.eq('electionId', election._id))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();

    const partylists = await ctx.db
      .query('partylists')
      .withIndex('by_deleted_election', (q) =>
        q.eq('deletedAt', undefined).eq('electionId', election._id),
      )
      .collect();
    const partylistsById = new Map(partylists.map((p) => [p._id, p] as const));

    // All votes for the election. For very large electorates we should switch
    // to an aggregate index, but materializing is fine at current scale.
    const allVotes = await ctx.db
      .query('votes')
      .withIndex('by_election_voter', (q) => q.eq('electionId', election._id))
      .collect();

    // Free-tier elections lag the live tally to the most recent elapsed hour
    // — e.g. at 8:51 AM the displayed counts only include votes whose
    // `_creationTime` is strictly before 8:00 AM. The bucket advances at the
    // top of each hour. The throttle applies to everyone including
    // commissioners so the results page is consistent across viewers.
    const free = isFreeTier(election);
    const now = Date.now();
    const cutoff = free ? freeTierResultsCutoff(now) : null;
    const eligibleVotes =
      cutoff === null
        ? allVotes
        : allVotes.filter((v) => v._creationTime < cutoff);

    const candidateVoteCounts = new Map<string, number>();
    const positionVoteCounts = new Map<string, number>();
    const positionAbstainCounts = new Map<string, number>();

    for (const vote of eligibleVotes) {
      if (vote.candidateId) {
        candidateVoteCounts.set(
          vote.candidateId,
          (candidateVoteCounts.get(vote.candidateId) ?? 0) + 1,
        );
      }
      if (vote.positionId) {
        positionVoteCounts.set(
          vote.positionId,
          (positionVoteCounts.get(vote.positionId) ?? 0) + 1,
        );
        if (!vote.candidateId) {
          positionAbstainCounts.set(
            vote.positionId,
            (positionAbstainCounts.get(vote.positionId) ?? 0) + 1,
          );
        }
      }
    }

    // For hiding real names we use the date-only "in progress" check —
    // viewers outside voting hours but still within the election window
    // must continue to see anonymized candidates when the commissioner
    // has chosen to hide them.
    const showRealNames =
      election.isCandidatesVisibleInRealtimeWhenOngoing ||
      !isElectionInProgress(election);

    return {
      election: {
        _id: election._id,
        name: election.name,
        slug: election.slug,
        startDate: election.startDate,
        endDate: election.endDate,
        votingHourStart: election.votingHourStart,
        votingHourEnd: election.votingHourEnd,
        nameArrangement: election.nameArrangement,
      },
      tier: {
        isFree: free,
        // When throttled, this is the cutoff timestamp (votes after this are
        // hidden) and the next refresh moment. Otherwise null.
        resultsCutoff: cutoff,
        nextRefreshAt:
          cutoff === null ? null : cutoff + FREE_RESULTS_LATENCY_MS,
      },
      positions: positions
        .sort((a, b) => a.order - b.order)
        .map((position) => {
          const positionCandidates = candidates
            .filter((c) => c.positionId === position._id)
            .map((c) => ({
              id: c._id,
              // Real name fields are emitted only when the viewer is allowed
              // to see them — otherwise the response carries no PII at all
              // and the Network tab can't be used to bypass anonymization.
              firstName: showRealNames ? c.firstName : '',
              middleName: showRealNames ? c.middleName : undefined,
              lastName: showRealNames ? c.lastName : '',
              partylistAcronym: showRealNames
                ? (partylistsById.get(c.partylistId)?.acronym ?? '')
                : '',
              votes: candidateVoteCounts.get(c._id) ?? 0,
            }))
            .sort((a, b) => b.votes - a.votes)
            .map((c, index) => ({
              ...c,
              displayName: showRealNames ? null : `Candidate ${index + 1}`,
            }));

          return {
            id: position._id,
            name: position.name,
            totalVotes: positionVoteCounts.get(position._id) ?? 0,
            abstainVotes: positionAbstainCounts.get(position._id) ?? 0,
            candidates: positionCandidates,
          };
        }),
    };
  },
});

/* ------------------------------------------------------------------ */
/* Turnout PDF report                                                  */
/* ------------------------------------------------------------------ */

/**
 * Internal query feeding the PDF generator. Pulls just the fields the
 * action needs — keeps the action's bundle small and avoids re-running
 * heavy logic.
 */
export const getTurnoutSnapshot = internalQuery({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    const election = await ctx.db.get(electionId);
    if (!election || election.deletedAt) return null;
    const [voters, votes] = await Promise.all([
      ctx.db
        .query('voters')
        .withIndex('by_election', (q) => q.eq('electionId', electionId))
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
      ctx.db
        .query('votes')
        .withIndex('by_election_voter', (q) => q.eq('electionId', electionId))
        .collect(),
    ]);
    const votedSet = new Set(votes.map((v) => v.voterId));
    return {
      election: {
        name: election.name,
        slug: election.slug,
        startDate: election.startDate,
        endDate: election.endDate,
      },
      voters: voters.map((v) => ({
        email: v.email,
        hasVoted: votedSet.has(v._id),
      })),
    };
  },
});

/**
 * Records a freshly generated PDF in `generated_election_results`. Called
 * by the action below after `ctx.storage.store()`.
 */
export const recordGeneratedResult = internalMutation({
  args: {
    electionId: v.id('elections'),
    storageId: v.id('_storage'),
    summary: v.object({
      total: v.number(),
      voted: v.number(),
      percent: v.number(),
      generatedAt: v.number(),
    }),
  },
  handler: async (ctx, { electionId, storageId, summary }) => {
    return await ctx.db.insert('generated_election_results', {
      electionId,
      result: { storageId, ...summary },
    });
  },
});

/**
 * Lists generated reports for an election with download URLs. Caller must
 * be a commissioner.
 */
export const listGeneratedReports = query({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);
    const rows = await ctx.db
      .query('generated_election_results')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .order('desc')
      .collect();
    return await Promise.all(
      rows.map(async (row) => {
        const result = row.result as {
          storageId: Id<'_storage'>;
          total: number;
          voted: number;
          percent: number;
          generatedAt: number;
        };
        const url = await ctx.storage.getUrl(result.storageId);
        return {
          _id: row._id,
          _creationTime: row._creationTime,
          url,
          summary: {
            total: result.total,
            voted: result.voted,
            percent: result.percent,
            generatedAt: result.generatedAt,
          },
        };
      }),
    );
  },
});
