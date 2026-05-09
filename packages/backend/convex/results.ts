import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import { query } from './_generated/server';

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

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const isOngoing =
      now >= election.startDate &&
      now < election.endDate + oneDayMs &&
      new Date(now).getHours() >= election.votingHourStart &&
      new Date(now).getHours() < election.votingHourEnd;
    const showRealNames =
      election.isCandidatesVisibleInRealtimeWhenOngoing ||
      isCommissioner ||
      !isOngoing;

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
              firstName: c.firstName,
              middleName: c.middleName,
              lastName: c.lastName,
              partylistAcronym:
                partylistsById.get(c.partylistId)?.acronym ?? '',
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
