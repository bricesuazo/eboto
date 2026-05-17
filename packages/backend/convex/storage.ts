import { ConvexError, v } from 'convex/values';

import { mutation } from './_generated/server';
import { requireUser } from './_helpers/auth';

/**
 * Returns a short-lived signed URL the client can POST a single file to.
 * The storage system handles auth on the upload itself; this mutation just
 * gates URL issuance to authenticated users so unauthenticated callers can't
 * burn quota.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Deletes an orphaned blob — used to clean up when a parent record is being
 * replaced (e.g. logo swap) or when a partial upload didn't get attached to
 * any record. Safe to call on a missing id; Convex throws which we swallow.
 */
export const deleteImage = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    await requireUser(ctx);
    try {
      await ctx.storage.delete(storageId);
    } catch (err) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Image not found',
        cause: String(err),
      });
    }
  },
});
