import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireCommissioner, requireUser } from './_helpers/auth';

/**
 * Lists active commissioners for an election. Caller must already be a
 * commissioner. We resolve to the auth `users` table to surface the email
 * + name for the management UI; both come from Convex Auth's `authTables`.
 */
export const list = query({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);
    const rows = await ctx.db
      .query('commissioners')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();
    return await Promise.all(
      rows.map(async (row) => {
        const user = await ctx.db.get(row.userId);
        return {
          _id: row._id,
          _creationTime: row._creationTime,
          userId: row.userId,
          email: user?.email ?? null,
          name: user?.name ?? null,
        };
      }),
    );
  },
});

/**
 * Adds a commissioner by email. The target must already have an account —
 * we don't auto-invite to avoid creating a side channel for unwanted account
 * creation. If they don't yet have an account, the commissioner is told to
 * have them sign up first.
 */
export const addByEmail = mutation({
  args: {
    electionId: v.id('elections'),
    email: v.string(),
  },
  handler: async (ctx, { electionId, email }) => {
    await requireCommissioner(ctx, electionId);
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Email is required.',
      });
    }
    const user = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', normalized))
      .first();
    if (!user) {
      throw new ConvexError({
        code: 'not_found',
        message:
          'No eBoto account uses that email yet. Have them sign up first, then try again.',
      });
    }
    const existing = await ctx.db
      .query('commissioners')
      .withIndex('by_user_election', (q) =>
        q.eq('userId', user._id).eq('electionId', electionId),
      )
      .first();
    if (existing && !existing.deletedAt) {
      throw new ConvexError({
        code: 'conflict',
        message: 'They are already a commissioner of this election.',
      });
    }
    if (existing && existing.deletedAt) {
      await ctx.db.patch(existing._id, { deletedAt: undefined });
      return existing._id;
    }
    return await ctx.db.insert('commissioners', {
      userId: user._id,
      electionId,
    });
  },
});

/**
 * Soft-removes a commissioner from an election. The last active commissioner
 * can't remove themselves — the election would be orphaned. We also refuse
 * self-removal when the caller has no other commissioner to take over (a
 * safer rule than letting the only commissioner orphan their own election).
 */
export const remove = mutation({
  args: { commissionerId: v.id('commissioners') },
  handler: async (ctx, { commissionerId }) => {
    const callerId = await requireUser(ctx);
    const target = await ctx.db.get(commissionerId);
    if (!target || target.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Commissioner not found.',
      });
    }
    await requireCommissioner(ctx, target.electionId);

    const active = await ctx.db
      .query('commissioners')
      .withIndex('by_election', (q) => q.eq('electionId', target.electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();
    if (active.length <= 1) {
      throw new ConvexError({
        code: 'forbidden',
        message:
          'Can\'t remove the last commissioner — add another first or delete the election.',
      });
    }
    if (target.userId === callerId && active.length === 2) {
      // Caller is one of two — removing themselves leaves a single commissioner.
      // That's allowed; only the *last* commissioner is protected above.
    }
    await ctx.db.patch(target._id, { deletedAt: Date.now() });
  },
});
