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
    return await ctx.db
      .query('partylists')
      .withIndex('by_deleted_election', (q) =>
        q.eq('deletedAt', undefined).eq('electionId', electionId),
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    electionId: v.id('elections'),
    name: v.string(),
    acronym: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getElectionOrThrow(ctx, args.electionId);
    await requireCommissioner(ctx, args.electionId);
    await requireElectionEditable(ctx, args.electionId);

    const acronym = args.acronym.trim();
    if (!acronym) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Acronym is required.',
      });
    }

    const conflict = await ctx.db
      .query('partylists')
      .withIndex('by_deleted_election', (q) =>
        q.eq('deletedAt', undefined).eq('electionId', args.electionId),
      )
      .filter((q) => q.eq(q.field('acronym'), acronym))
      .first();
    if (conflict) {
      throw new ConvexError({
        code: 'conflict',
        message: 'A partylist with that acronym already exists.',
      });
    }

    return await ctx.db.insert('partylists', {
      name: args.name.trim(),
      acronym,
      description: args.description?.trim() ?? undefined,
      electionId: args.electionId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('partylists'),
    name: v.string(),
    acronym: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pl = await ctx.db.get(args.id);
    if (!pl || pl.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Partylist not found',
      });
    }
    await requireCommissioner(ctx, pl.electionId);
    await requireElectionEditable(ctx, pl.electionId);

    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      acronym: args.acronym.trim(),
      description: args.description?.trim() ?? undefined,
    });
  },
});

export const softDelete = mutation({
  args: { id: v.id('partylists') },
  handler: async (ctx, { id }) => {
    const pl = await ctx.db.get(id);
    if (!pl || pl.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Partylist not found',
      });
    }
    await requireCommissioner(ctx, pl.electionId);
    await requireElectionEditable(ctx, pl.electionId);
    if (pl.acronym === 'IND') {
      throw new ConvexError({
        code: 'forbidden',
        message: 'The default Independent partylist cannot be deleted.',
      });
    }
    await ctx.db.patch(id, { deletedAt: Date.now() });
  },
});
