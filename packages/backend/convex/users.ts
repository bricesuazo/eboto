import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireUser } from './_helpers/auth';

/**
 * The signed-in user, or null when anonymous. Used everywhere the UI needs
 * the viewer's email/name (header, dashboard, profile page).
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
  },
});

/**
 * Updates the signed-in user's display name. Email is managed by the auth
 * provider, so we don't expose it here.
 */
export const updateProfile = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await requireUser(ctx);
    const trimmed = name.trim();
    if (trimmed.length > 80) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Name must be 80 characters or fewer.',
      });
    }
    await ctx.db.patch(userId, { name: trimmed || undefined });
  },
});

/**
 * Soft-deletes the caller's account. We blank the email + name on the
 * `users` row so they can't be addressed by future emails, and mark the
 * user as anonymous so Convex Auth treats them as a fresh session if they
 * sign back in with the same email later.
 *
 * Hard delete is intentionally not offered here — elections the user
 * commissioned still need a foreign-key target. Operations can purge
 * deleted users out-of-band once their commissioner rows are reassigned
 * or their elections deleted.
 */
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Account not found.',
      });
    }
    await ctx.db.patch(userId, {
      name: undefined,
      email: undefined,
      image: undefined,
      isAnonymous: true,
    });
    // Tombstone session state — Convex Auth will recreate fresh records on
    // the next sign-in.
    for await (const session of ctx.db
      .query('authSessions')
      .withIndex('userId', (q) => q.eq('userId', userId))) {
      await ctx.db.delete(session._id);
    }
  },
});
