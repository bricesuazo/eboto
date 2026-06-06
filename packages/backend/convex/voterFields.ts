import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import {
  requireCommissioner,
  requireElectionEditable,
} from './_helpers/auth';
import { voterFieldType } from './schema';

export const list = query({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);
    return await ctx.db
      .query('voterFields')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();
  },
});

export const create = mutation({
  args: {
    electionId: v.id('elections'),
    name: v.string(),
    type: voterFieldType,
  },
  handler: async (ctx, { electionId, name, type }) => {
    await requireCommissioner(ctx, electionId);
    await requireElectionEditable(ctx, electionId);
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Field name is required.',
      });
    }
    if (trimmed.toLowerCase() === 'email') {
      throw new ConvexError({
        code: 'invalid_argument',
        message: '"email" is reserved and cannot be a custom field.',
      });
    }
    const existing = await ctx.db
      .query('voterFields')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();
    if (existing.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new ConvexError({
        code: 'conflict',
        message: 'A field with that name already exists.',
      });
    }
    return await ctx.db.insert('voterFields', {
      electionId,
      name: trimmed,
      type,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('voterFields'),
    name: v.string(),
    type: voterFieldType,
  },
  handler: async (ctx, { id, name, type }) => {
    const field = await ctx.db.get(id);
    if (!field || field.deletedAt) {
      throw new ConvexError({ code: 'not_found', message: 'Field not found' });
    }
    await requireCommissioner(ctx, field.electionId);
    await requireElectionEditable(ctx, field.electionId);
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Field name is required.',
      });
    }
    if (trimmed.toLowerCase() === 'email') {
      throw new ConvexError({
        code: 'invalid_argument',
        message: '"email" is reserved and cannot be a custom field.',
      });
    }
    const conflict = await ctx.db
      .query('voterFields')
      .withIndex('by_election', (q) => q.eq('electionId', field.electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();
    if (
      conflict.some(
        (f) =>
          f._id !== id && f.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      throw new ConvexError({
        code: 'conflict',
        message: 'A field with that name already exists.',
      });
    }
    await ctx.db.patch(id, { name: trimmed, type });
  },
});

export const softDelete = mutation({
  args: { id: v.id('voterFields') },
  handler: async (ctx, { id }) => {
    const field = await ctx.db.get(id);
    if (!field || field.deletedAt) {
      throw new ConvexError({ code: 'not_found', message: 'Field not found' });
    }
    await requireCommissioner(ctx, field.electionId);
    await requireElectionEditable(ctx, field.electionId);
    await ctx.db.patch(id, { deletedAt: Date.now() });
  },
});

export const statsByField = query({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);
    const [fields, voters, votes] = await Promise.all([
      ctx.db
        .query('voterFields')
        .withIndex('by_election', (q) => q.eq('electionId', electionId))
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
      ctx.db
        .query('voters')
        .withIndex('by_election', (q) => q.eq('electionId', electionId))
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
      ctx.db
        .query('votes')
        .withIndex('by_election_voter', (q) => q.eq('electionId', electionId))
        .collect(),
    ]);

    const votedSet = new Set(votes.map((v) => v.voterId));

    return fields.map((f) => {
      const buckets = new Map<string, { total: number; voted: number }>();
      const fieldData = (raw: unknown): Record<string, unknown> | null =>
        raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
      for (const voter of voters) {
        const data = fieldData(voter.field);
        const cell = data ? data[f.name] : undefined;
        const value =
          cell == null || cell === ''
            ? '(no value)'
            : typeof cell === 'string' ||
                typeof cell === 'number' ||
                typeof cell === 'boolean'
              ? String(cell)
              : '(no value)';
        const bucket = buckets.get(value) ?? { total: 0, voted: 0 };
        bucket.total += 1;
        if (votedSet.has(voter._id)) bucket.voted += 1;
        buckets.set(value, bucket);
      }
      return {
        fieldId: f._id,
        name: f.name,
        type: f.type,
        buckets: Array.from(buckets, ([value, counts]) => ({
          value,
          total: counts.total,
          voted: counts.voted,
        })).sort((a, b) => b.total - a.total),
      };
    });
  },
});
