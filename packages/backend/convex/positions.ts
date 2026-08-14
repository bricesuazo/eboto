import { ConvexError, v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import {
  getElectionOrThrow,
  loadElectionForEdit,
  requireBeforeVotingOpens,
  requireChangeReason,
  requireCommissioner,
} from './_helpers/auth';
import type { FieldSpec } from './_helpers/changeLog';
import { diffFields, recordElectionChange } from './_helpers/changeLog';

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
    // Hard lock: a position added mid-election is one that everyone who
    // already voted never got to vote on.
    await requireBeforeVotingOpens(
      ctx,
      args.electionId,
      'adding a new position',
    );

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

/** Descriptive position fields that stay editable after voting opens. */
const POSITION_LOGGED_FIELDS: FieldSpec[] = [
  { key: 'name', label: 'Position name' },
  { key: 'description', label: 'Description' },
];

export const update = mutation({
  args: {
    id: v.id('positions'),
    name: v.string(),
    description: v.optional(v.string()),
    min: v.number(),
    max: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pos = await ctx.db.get(args.id);
    if (!pos || pos.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Position not found',
      });
    }
    const { userId } = await requireCommissioner(ctx, pos.electionId);
    const { votingStarted } = await loadElectionForEdit(ctx, pos.electionId);

    if (args.min < 0 || args.max < 1 || args.min > args.max) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Position min must be ≥ 0 and ≤ max (which must be ≥ 1).',
      });
    }

    // Renaming a position is fine mid-election; changing how many candidates
    // may be picked is not — ballots already cast were validated against the
    // old bounds and could violate the new ones.
    if (votingStarted && (args.min !== pos.min || args.max !== pos.max)) {
      throw new ConvexError({
        code: 'forbidden',
        message:
          'Voting has started, so the number of candidates that can be selected for a position can no longer change — ballots already cast were checked against the current limits. The name and description are still editable.',
      });
    }

    const patch = {
      name: args.name.trim(),
      description: args.description?.trim() ?? undefined,
      min: args.min,
      max: args.max,
    };
    const changes = votingStarted
      ? diffFields(pos, patch, POSITION_LOGGED_FIELDS)
      : [];
    const reason = requireChangeReason(args.reason, changes.length > 0);

    await ctx.db.patch(args.id, patch);

    if (changes.length > 0) {
      await recordElectionChange(ctx, {
        electionId: pos.electionId,
        actorUserId: userId,
        entity: 'position',
        entityId: args.id,
        entityLabel: patch.name,
        action: 'update',
        changes,
        reason,
      });
    }
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
    // Hard lock: removing a race after ballots exist discards the votes cast
    // in it.
    await requireBeforeVotingOpens(ctx, pos.electionId, 'deleting a position');

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
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { electionId, orderedIds, reason: rawReason }) => {
    const { userId } = await requireCommissioner(ctx, electionId);
    const { votingStarted } = await loadElectionForEdit(ctx, electionId);

    // Reordering only changes the sequence positions appear in — no ballot
    // becomes invalid — but ballot order is not neutral, so a mid-election
    // reshuffle is logged like any other change.
    const existing = await ctx.db
      .query('positions')
      .withIndex('by_deleted_election', (q) =>
        q.eq('deletedAt', undefined).eq('electionId', electionId),
      )
      .collect();
    const nameById = new Map(existing.map((p) => [p._id, p.name] as const));
    const orderLabel = (ids: readonly Id<'positions'>[]) =>
      ids.map((id) => nameById.get(id) ?? '?').join(' → ');
    const beforeLabel = orderLabel(
      [...existing].sort((a, b) => a.order - b.order).map((p) => p._id),
    );
    const afterLabel = orderLabel(orderedIds);

    const reason = requireChangeReason(
      rawReason,
      votingStarted && beforeLabel !== afterLabel,
    );

    for (const [order, id] of orderedIds.entries()) {
      const pos = await ctx.db.get(id);
      if (pos && !pos.deletedAt && pos.electionId === electionId) {
        await ctx.db.patch(id, { order });
      }
    }

    if (votingStarted && beforeLabel !== afterLabel) {
      await recordElectionChange(ctx, {
        electionId,
        actorUserId: userId,
        entity: 'position',
        entityLabel: 'Ballot order',
        action: 'reorder',
        changes: [
          {
            field: 'order',
            label: 'Position order',
            before: beforeLabel,
            after: afterLabel,
          },
        ],
        reason,
      });
    }
  },
});
