import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { votingStartAt } from './election_timing';

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

/**
 * Tamper guard for ballot-affecting mutations. Throws `forbidden` once voting
 * has opened (i.e. `Date.now() >= votingStartAt(election)`). Returns the
 * loaded election so callers avoid a second fetch.
 *
 * Apply to every mutation that could change what voters see or who can vote:
 * candidates, positions, partylists, voter fields, voters, election timing /
 * publicity / logo, and election soft-delete. Do NOT apply to messaging,
 * billing, or vote casting itself.
 *
 * The lock is intentionally strict: even "harmless" edits like fixing a
 * description typo are blocked once voting starts, because the cost of a
 * false block (re-clone, re-launch) is much smaller than the cost of an
 * undetected mid-election tamper. Relax per-field only if a concrete need
 * appears.
 */
export async function requireElectionEditable(
  ctx: QueryCtx | MutationCtx,
  electionId: Id<'elections'>,
): Promise<Doc<'elections'>> {
  const election = await getElectionOrThrow(ctx, electionId);
  if (Date.now() >= votingStartAt(election)) {
    throw new ConvexError({
      code: 'forbidden',
      message:
        'Voting has already started; this change is locked to prevent ballot tampering.',
    });
  }
  return election;
}
