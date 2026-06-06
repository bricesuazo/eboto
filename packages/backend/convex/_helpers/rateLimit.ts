import { ConvexError } from 'convex/values';

import type { MutationCtx } from '../_generated/server';

/**
 * Fixed-window rate limiter. Stores one row per `key` and resets the
 * counter when `Date.now()` rolls past `windowStart + windowMs`. Throws
 * `ConvexError({ code: 'rate_limited' })` when the caller would exceed
 * `limit` requests in the current window.
 *
 * Pick a `key` that combines the action and the subject — e.g.
 * `vote:${userId}` or `contact:${ipAddress}`. The transaction guarantees
 * that two concurrent calls can't both squeak under the limit: Convex
 * mutations are serializable.
 *
 * Use sparingly: every call adds a write. Reserve for endpoints where the
 * cost of unbounded calls matters (vote casting, contact form, sign-in).
 */
export async function enforceRateLimit(
  ctx: MutationCtx,
  {
    key,
    limit,
    windowMs,
    message,
  }: {
    key: string;
    limit: number;
    windowMs: number;
    message?: string;
  },
): Promise<void> {
  const now = Date.now();
  const existing = await ctx.db
    .query('rateLimits')
    .withIndex('by_key', (q) => q.eq('key', key))
    .first();

  if (!existing) {
    await ctx.db.insert('rateLimits', { key, windowStart: now, count: 1 });
    return;
  }

  if (now >= existing.windowStart + windowMs) {
    await ctx.db.patch(existing._id, { windowStart: now, count: 1 });
    return;
  }

  if (existing.count >= limit) {
    throw new ConvexError({
      code: 'rate_limited',
      message:
        message ??
        `Too many requests — try again in ${Math.ceil(
          (existing.windowStart + windowMs - now) / 1000,
        )}s.`,
    });
  }

  await ctx.db.patch(existing._id, { count: existing.count + 1 });
}
