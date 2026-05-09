import { ConvexError } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';

/** Throws unauthorized when the request isn't authenticated. */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError({ code: 'unauthorized', message: 'Sign in required' });
  }
  return userId;
}

/**
 * Throws when the caller is not an active commissioner of `electionId`.
 * Returns the commissioner row so callers can attribute writes if needed.
 */
export async function requireCommissioner(
  ctx: QueryCtx | MutationCtx,
  electionId: Id<'elections'>,
) {
  const userId = await requireUser(ctx);
  const commissioner = await ctx.db
    .query('commissioners')
    .withIndex('by_user_election', (q) =>
      q.eq('userId', userId).eq('electionId', electionId),
    )
    .filter((q) => q.eq(q.field('deletedAt'), undefined))
    .first();
  if (!commissioner) {
    throw new ConvexError({
      code: 'forbidden',
      message: 'Not a commissioner of this election',
    });
  }
  return { userId, commissioner };
}

/** Loads the election or throws not_found when missing/deleted. */
export async function getElectionOrThrow(
  ctx: QueryCtx | MutationCtx,
  electionId: Id<'elections'>,
) {
  const election = await ctx.db.get(electionId);
  if (!election || election.deletedAt) {
    throw new ConvexError({
      code: 'not_found',
      message: 'Election not found',
    });
  }
  return election;
}
