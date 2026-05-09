import { ConvexError } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
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
      throw new ConvexError({ code: 'unauthorized', message: 'Sign in required' });
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
