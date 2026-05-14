import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireUser } from './_helpers/auth';

/**
 * Files a problem report against an election (or the platform overall when
 * `electionId` is omitted). The reporter is always the signed-in user — we
 * don't accept anonymous reports here because the marketing contact form
 * already covers that path.
 */
export const create = mutation({
  args: {
    subject: v.string(),
    description: v.string(),
    electionId: v.optional(v.id('elections')),
  },
  handler: async (ctx, { subject, description, electionId }) => {
    const userId = await requireUser(ctx);
    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();
    if (trimmedSubject.length < 3) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Subject must be at least 3 characters.',
      });
    }
    if (trimmedDescription.length < 10) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Please describe the problem in at least 10 characters.',
      });
    }
    return await ctx.db.insert('reported_problems', {
      subject: trimmedSubject,
      description: trimmedDescription,
      userId,
      electionId,
    });
  },
});

/**
 * Lists the caller's own reports (any election + platform-wide). Used by the
 * profile/account page so users can track follow-up.
 */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query('reported_problems')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .order('desc')
      .take(50);
  },
});
