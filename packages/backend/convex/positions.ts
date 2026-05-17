import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import {
  getElectionOrThrow,
  requireCommissioner,
  requireElectionEditable,
} from './_helpers/auth';

export const list = query({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);
    const rows = await ctx.db
      .query('positions')
      .withIndex('by_deleted_election', (q) =>
        q.eq('deletedAt', undefined).eq('electionId', electionId),
      )
      .collect();
    return rows.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: {
    electionId: v.id('elections'),
    name: v.string(),
    description: v.optional(v.string()),
    min: v.number(),
    max: v.number(),
  },
  handler: async (ctx, args) => {
    await getElectionOrThrow(ctx, args.electionId);
    await requireCommissioner(ctx, args.electionId);
    await requireElectionEditable(ctx, args.electionId);

    if (args.min < 0 || args.max < 1 || args.min > args.max) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Position min must be ≥ 0 and ≤ max (which must be ≥ 1).',
      });
    }

    // Append at the end.
    const existing = await ctx.db
      .query('positions')
      .withIndex('by_deleted_election', (q) =>
        q.eq('deletedAt', undefined).eq('electionId', args.electionId),
      )
      .collect();
    const order = existing.length;

    return await ctx.db.insert('positions', {
      name: args.name.trim(),
      description: args.description?.trim() ?? undefined,
      min: args.min,
      max: args.max,
      order,
      electionId: args.electionId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('positions'),
    name: v.string(),
    description: v.optional(v.string()),
    min: v.number(),
    max: v.number(),
  },
  handler: async (ctx, args) => {
    const pos = await ctx.db.get(args.id);
    if (!pos || pos.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Position not found',
      });
    }
    await requireCommissioner(ctx, pos.electionId);
    await requireElectionEditable(ctx, pos.electionId);

    if (args.min < 0 || args.max < 1 || args.min > args.max) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Position min must be ≥ 0 and ≤ max (which must be ≥ 1).',
      });
    }

    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      description: args.description?.trim() ?? undefined,
      min: args.min,
      max: args.max,
    });
  },
});

export const softDelete = mutation({
  args: { id: v.id('positions') },
  handler: async (ctx, { id }) => {
    const pos = await ctx.db.get(id);
    if (!pos || pos.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Position not found',
      });
    }
    await requireCommissioner(ctx, pos.electionId);
    await requireElectionEditable(ctx, pos.electionId);

    const candidatesUsing = await ctx.db
      .query('candidates')
      .withIndex('by_position', (q) => q.eq('positionId', id))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (candidatesUsing) {
      throw new ConvexError({
        code: 'conflict',
        message:
          'Remove or reassign candidates for this position before deleting it.',
      });
    }

    await ctx.db.patch(id, { deletedAt: Date.now() });
  },
});

export const reorder = mutation({
  args: {
    electionId: v.id('elections'),
    orderedIds: v.array(v.id('positions')),
  },
  handler: async (ctx, { electionId, orderedIds }) => {
    await requireCommissioner(ctx, electionId);
    await requireElectionEditable(ctx, electionId);
    for (const [order, id] of orderedIds.entries()) {
      const pos = await ctx.db.get(id);
      if (pos && !pos.deletedAt && pos.electionId === electionId) {
        await ctx.db.patch(id, { order });
      }
    }
  },
});
