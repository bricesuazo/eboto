import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import {
  getElectionOrThrow,
  loadElectionForEdit,
  requireChangeReason,
  requireCommissioner,
} from './_helpers/auth';
import type { FieldSpec } from './_helpers/changeLog';
import { diffFields, recordElectionChange } from './_helpers/changeLog';

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
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getElectionOrThrow(ctx, args.electionId);
    const { userId } = await requireCommissioner(ctx, args.electionId);
    // A new partylist can't take on candidates mid-election (candidate
    // reassignment is locked), so adding one is inert as far as ballots go.
    const { votingStarted } = await loadElectionForEdit(ctx, args.electionId);
    const reason = requireChangeReason(args.reason, votingStarted);

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

    const partylistId = await ctx.db.insert('partylists', {
      name: args.name.trim(),
      acronym,
      description: args.description?.trim() ?? undefined,
      electionId: args.electionId,
    });

    if (votingStarted) {
      await recordElectionChange(ctx, {
        electionId: args.electionId,
        actorUserId: userId,
        entity: 'partylist',
        entityId: partylistId,
        entityLabel: `${args.name.trim()} (${acronym})`,
        action: 'create',
        reason,
      });
    }

    return partylistId;
  },
});

/** Partylist fields that stay editable after voting opens. */
const PARTYLIST_LOGGED_FIELDS: FieldSpec[] = [
  { key: 'name', label: 'Partylist name' },
  { key: 'acronym', label: 'Acronym' },
  { key: 'description', label: 'Description' },
];

export const update = mutation({
  args: {
    id: v.id('partylists'),
    name: v.string(),
    acronym: v.string(),
    description: v.optional(v.string()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pl = await ctx.db.get(args.id);
    if (!pl || pl.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Partylist not found',
      });
    }
    const { userId } = await requireCommissioner(ctx, pl.electionId);
    const { votingStarted } = await loadElectionForEdit(ctx, pl.electionId);

    const patch = {
      name: args.name.trim(),
      acronym: args.acronym.trim(),
      description: args.description?.trim() ?? undefined,
    };
    const changes = votingStarted
      ? diffFields(pl, patch, PARTYLIST_LOGGED_FIELDS)
      : [];
    const reason = requireChangeReason(args.reason, changes.length > 0);

    await ctx.db.patch(args.id, patch);

    if (changes.length > 0) {
      await recordElectionChange(ctx, {
        electionId: pl.electionId,
        actorUserId: userId,
        entity: 'partylist',
        entityId: args.id,
        entityLabel: `${patch.name} (${patch.acronym})`,
        action: 'update',
        changes,
        reason,
      });
    }
  },
});

export const softDelete = mutation({
  args: { id: v.id('partylists'), reason: v.optional(v.string()) },
  handler: async (ctx, { id, reason: rawReason }) => {
    const pl = await ctx.db.get(id);
    if (!pl || pl.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Partylist not found',
      });
    }
    const { userId } = await requireCommissioner(ctx, pl.electionId);
    const { votingStarted } = await loadElectionForEdit(ctx, pl.electionId);
    if (pl.acronym === 'IND') {
      throw new ConvexError({
        code: 'forbidden',
        message: 'The default Independent partylist cannot be deleted.',
      });
    }

    // Candidates carry a `partylistId`; deleting a partylist that still has
    // some would leave them pointing at a removed row, and mid-election that
    // silently changes what appears on the ballot. Candidates can't be
    // reassigned once voting opens, so this is effectively "empty only".
    if (votingStarted) {
      const inUse = await ctx.db
        .query('candidates')
        .withIndex('by_partylist', (q) => q.eq('partylistId', id))
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .first();
      if (inUse) {
        throw new ConvexError({
          code: 'conflict',
          message:
            'Voting has started, so a partylist with candidates on the ballot can no longer be deleted. You can still rename it.',
        });
      }
    }

    const reason = requireChangeReason(rawReason, votingStarted);
    await ctx.db.patch(id, { deletedAt: Date.now() });

    if (votingStarted) {
      await recordElectionChange(ctx, {
        electionId: pl.electionId,
        actorUserId: userId,
        entity: 'partylist',
        entityId: id,
        entityLabel: `${pl.name} (${pl.acronym})`,
        action: 'delete',
        reason,
      });
    }
  },
});
