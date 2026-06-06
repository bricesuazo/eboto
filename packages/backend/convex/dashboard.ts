import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError } from 'convex/values';

import { query } from './_generated/server';

/**
 * Lists all elections for which the current user is an active commissioner.
 * Throws when not signed in.
 */
export const myElections = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: 'unauthorized',
        message: 'Sign in required',
      });
    }

    const commissioners = await ctx.db
      .query('commissioners')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();

    const elections = await Promise.all(
      commissioners.map(async (c) => {
        const election = await ctx.db.get(c.electionId);
        if (!election || election.deletedAt) return null;
        const logoUrl = election.logoStorageId
          ? await ctx.storage.getUrl(election.logoStorageId)
          : null;
        return { ...election, logoUrl };
      }),
    );

    return elections
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Lists all elections for which the current user is an eligible voter.
 * Excludes elections the user already commissions to avoid duplication, and
 * elections with PRIVATE publicity (only commissioners can see those).
 * Returns an empty list when not signed in or when the user has no email.
 */
export const myVoterElections = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.email) return [];

    const email = user.email.trim().toLowerCase();
    const voterRows = await ctx.db
      .query('voters')
      .withIndex('by_email', (q) => q.eq('email', email))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();

    const commissionerRows = await ctx.db
      .query('commissioners')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();
    const commissionerElectionIds = new Set(
      commissionerRows.map((c) => c.electionId),
    );

    const elections = await Promise.all(
      voterRows.map(async (voter) => {
        if (commissionerElectionIds.has(voter.electionId)) return null;
        const election = await ctx.db.get(voter.electionId);
        if (!election || election.deletedAt) return null;
        if (election.publicity === 'PRIVATE') return null;
        const logoUrl = election.logoStorageId
          ? await ctx.storage.getUrl(election.logoStorageId)
          : null;
        return { ...election, logoUrl };
      }),
    );

    return elections
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .sort((a, b) => b._creationTime - a._creationTime);
  },
});
