import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { action, internalMutation, internalQuery, query } from './_generated/server';
import { requireCommissioner } from './_helpers/auth';
import { isElectionInProgress } from './_helpers/election_timing';

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
    // tallies once they've cast a ballot. Commissioners always see results.
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

    const candidateVoteCounts = new Map<string, number>();
    const positionVoteCounts = new Map<string, number>();
    const positionAbstainCounts = new Map<string, number>();

    for (const vote of allVotes) {
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
      isCommissioner ||
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
      isCommissioner,
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
 * Builds a turnout-report PDF for an ended election and stores it. Idempotent
 * is up to the caller — re-invoking creates a fresh row and a new blob.
 *
 * Trigger sources:
 *   - Inngest `election-ended` function (auto, on `endDate`).
 *   - Manual "Generate report" button in the dashboard for commissioners.
 */
export const generateTurnoutPdf = action({
  args: { electionId: v.id('elections') },
  handler: async (
    ctx,
    { electionId },
  ): Promise<{
    generatedId: Id<'generated_election_results'>;
    storageId: Id<'_storage'>;
  }> => {
    const snap = await ctx.runQuery(internal.results.getTurnoutSnapshot, {
      electionId,
    });
    if (!snap) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Election not found',
      });
    }
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const dark = rgb(0.04, 0.04, 0.04);
    const muted = rgb(0.4, 0.4, 0.4);
    const accent = rgb(0.086, 0.639, 0.29);

    const totalVoters = snap.voters.length;
    const totalVoted = snap.voters.filter((v) => v.hasVoted).length;
    const percent =
      totalVoters === 0 ? 0 : Math.round((totalVoted / totalVoters) * 1000) / 10;

    let page = pdf.addPage([612, 792]);
    let y = 760;
    const margin = 48;

    page.drawText('Voter Turnout Report', {
      x: margin,
      y,
      size: 22,
      font: bold,
      color: dark,
    });
    y -= 28;
    page.drawText(snap.election.name, {
      x: margin,
      y,
      size: 14,
      font,
      color: muted,
    });
    y -= 18;
    page.drawText(
      `${formatDate(snap.election.startDate)} – ${formatDate(snap.election.endDate)}`,
      { x: margin, y, size: 11, font, color: muted },
    );
    y -= 36;

    page.drawText(`Turnout: ${percent}%`, {
      x: margin,
      y,
      size: 18,
      font: bold,
      color: accent,
    });
    y -= 18;
    page.drawText(
      `${totalVoted.toLocaleString()} of ${totalVoters.toLocaleString()} registered voters cast a ballot.`,
      { x: margin, y, size: 11, font, color: dark },
    );
    y -= 30;

    page.drawText('Voter list', {
      x: margin,
      y,
      size: 13,
      font: bold,
      color: dark,
    });
    y -= 18;
    page.drawText('Email', { x: margin, y, size: 10, font: bold, color: dark });
    page.drawText('Status', {
      x: 460,
      y,
      size: 10,
      font: bold,
      color: dark,
    });
    y -= 14;

    for (const voter of snap.voters) {
      if (y < margin + 40) {
        page = pdf.addPage([612, 792]);
        y = 760;
      }
      page.drawText(voter.email, {
        x: margin,
        y,
        size: 10,
        font,
        color: dark,
      });
      page.drawText(voter.hasVoted ? 'Voted' : 'Not voted', {
        x: 460,
        y,
        size: 10,
        font,
        color: voter.hasVoted ? accent : muted,
      });
      y -= 14;
    }

    const bytes = await pdf.save();
    const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
    const storageId = await ctx.storage.store(blob);

    const generatedId = await ctx.runMutation(
      internal.results.recordGeneratedResult,
      {
        electionId,
        storageId,
        summary: {
          total: totalVoters,
          voted: totalVoted,
          percent,
          generatedAt: Date.now(),
        },
      },
    );

    return { generatedId, storageId };
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

function formatDate(ms: number) {
  const d = new Date(ms);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
