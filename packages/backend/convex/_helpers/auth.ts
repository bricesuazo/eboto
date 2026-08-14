import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError } from 'convex/values';

import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { votingStartAt } from './election_timing';

/** Throws unauthorized when the request isn't authenticated. */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError({
      code: 'unauthorized',
      message: 'Sign in required',
    });
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
 * Whether `election` is readable by the current viewer. Mirrors the publicity
 * rules enforced by `elections.getBySlug`:
 *
 *   - PUBLIC  → anyone.
 *   - VOTER   → commissioners and registered voters.
 *   - PRIVATE → commissioners only.
 *
 * `user` is passed in rather than looked up so callers that already loaded it
 * (the election landing query does) don't pay for a second read.
 */
export async function viewerHasElectionAccess(
  ctx: QueryCtx | MutationCtx,
  election: Doc<'elections'>,
  user: Doc<'users'> | null,
): Promise<boolean> {
  if (!user) return false;

  const commissioner = await ctx.db
    .query('commissioners')
    .withIndex('by_user_election', (q) =>
      q.eq('userId', user._id).eq('electionId', election._id),
    )
    .filter((q) => q.eq(q.field('deletedAt'), undefined))
    .first();

  if (commissioner) return true;

  const email = user.email;

  if (election.publicity === 'VOTER' && email) {
    const voter = await ctx.db
      .query('voters')
      .withIndex('by_election_email', (q) =>
        q.eq('electionId', election._id).eq('email', email),
      )
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (voter) return true;
  }

  return false;
}

/* ------------------------------------------------------------------ */
/* Post-start edit policy                                              */
/* ------------------------------------------------------------------ */

/**
 * Once `votingStartAt(election)` passes, the election is no longer frozen —
 * it becomes *transparent*. Commissioners can still correct genuine mistakes,
 * but every such change is written to `electionChangeLogs` and published on
 * the election's public page.
 *
 * Two tiers of guard implement that policy:
 *
 *   - {@link loadElectionForEdit} — for changes that stay possible after
 *     voting opens. Returns `votingStarted` so the caller can demand a reason
 *     ({@link requireChangeReason}) and log the diff.
 *   - {@link requireBeforeVotingOpens} — hard lock, for changes that can
 *     never be made safe once a single ballot exists: adding or removing
 *     candidates and positions, moving a candidate to a different position,
 *     changing how many picks a position allows, moving the start of voting,
 *     changing the slug (it would break links already emailed to voters), and
 *     deleting the election outright.
 *
 * Neither applies to messaging, billing, or vote casting.
 */
export interface ElectionForEdit {
  election: Doc<'elections'>;
  /** True once voting has opened — transparency requirements are in force. */
  votingStarted: boolean;
}

export async function loadElectionForEdit(
  ctx: QueryCtx | MutationCtx,
  electionId: Id<'elections'>,
): Promise<ElectionForEdit> {
  const election = await getElectionOrThrow(ctx, electionId);
  return { election, votingStarted: Date.now() >= votingStartAt(election) };
}

/**
 * Hard lock. Throws `forbidden` once voting has opened.
 *
 * `what` names the blocked operation so the message tells the commissioner
 * what to do instead of just saying "no".
 */
export async function requireBeforeVotingOpens(
  ctx: QueryCtx | MutationCtx,
  electionId: Id<'elections'>,
  what: string,
): Promise<Doc<'elections'>> {
  const election = await getElectionOrThrow(ctx, electionId);
  if (Date.now() >= votingStartAt(election)) {
    throw new ConvexError({
      code: 'forbidden',
      message: `Voting has started, so ${what} is no longer possible — it would invalidate ballots that have already been cast. You can still correct names, descriptions, photos, and timing; those changes are published to the election's change log.`,
    });
  }
  return election;
}

/** Bounds on the published reason accompanying a post-start change. */
export const MIN_CHANGE_REASON_LENGTH = 10;
export const MAX_CHANGE_REASON_LENGTH = 300;

/**
 * Validates the reason a commissioner gave for a post-start change and
 * returns it trimmed. Before voting opens no reason is needed, so this
 * returns `''` and nothing is logged.
 *
 * The minimum length is a deliberate speed bump: a reason that gets
 * published next to the diff should be a sentence, not a keystroke.
 */
export function requireChangeReason(
  reason: string | undefined,
  votingStarted: boolean,
): string {
  const trimmed = reason?.trim() ?? '';
  if (!votingStarted) return '';
  if (trimmed.length < MIN_CHANGE_REASON_LENGTH) {
    throw new ConvexError({
      code: 'invalid_argument',
      message: `Voting is underway, so this change will be published to the election's change log. Explain it in at least ${MIN_CHANGE_REASON_LENGTH} characters.`,
    });
  }
  if (trimmed.length > MAX_CHANGE_REASON_LENGTH) {
    throw new ConvexError({
      code: 'invalid_argument',
      message: `Keep the reason to ${MAX_CHANGE_REASON_LENGTH} characters or fewer.`,
    });
  }
  return trimmed;
}
