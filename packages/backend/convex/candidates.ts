import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireCommissioner } from './_helpers/auth';

/**
 * Returns `null` when the election or candidate doesn't exist. Routes treat
 * `null` as a 404 — keeping it out of `ConvexError` means we don't pollute
 * the deployment logs with every bad-slug navigation.
 */
export const getBySlug = query({
  args: {
    electionSlug: v.string(),
    candidateSlug: v.string(),
  },
  handler: async (ctx, { electionSlug, candidateSlug }) => {
    const election = await ctx.db
      .query('elections')
      .withIndex('by_slug', (q) => q.eq('slug', electionSlug))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();

    if (!election) return null;

    const candidate = await ctx.db
      .query('candidates')
      .withIndex('by_election_slug', (q) =>
        q.eq('electionId', election._id).eq('slug', candidateSlug),
      )
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();

    if (!candidate) return null;

    const [
      position,
      partylist,
      platforms,
      achievements,
      affiliations,
      eventsAttended,
      imageUrl,
      electionLogoUrl,
    ] = await Promise.all([
      ctx.db.get(candidate.positionId),
      ctx.db.get(candidate.partylistId),
      ctx.db
        .query('platforms')
        .withIndex('by_candidate', (q) => q.eq('candidateId', candidate._id))
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
      ctx.db
        .query('achievements')
        .withIndex('by_credential', (q) =>
          q.eq('credentialId', candidate.credentialId),
        )
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
      ctx.db
        .query('affiliations')
        .withIndex('by_credential', (q) =>
          q.eq('credentialId', candidate.credentialId),
        )
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
      ctx.db
        .query('events_attended')
        .withIndex('by_credential', (q) =>
          q.eq('credentialId', candidate.credentialId),
        )
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect(),
      candidate.imageStorageId
        ? ctx.storage.getUrl(candidate.imageStorageId)
        : Promise.resolve(null),
      election.logoStorageId
        ? ctx.storage.getUrl(election.logoStorageId)
        : Promise.resolve(null),
    ]);

    return {
      election: { ...election, logoUrl: electionLogoUrl },
      candidate: {
        ...candidate,
        imageUrl,
        position,
        partylist,
        platforms,
        credentials: { achievements, affiliations, eventsAttended },
      },
    };
  },
});

export const list = query({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);
    const candidates = await ctx.db
      .query('candidates')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();
    const partylists = await ctx.db
      .query('partylists')
      .withIndex('by_deleted_election', (q) =>
        q.eq('deletedAt', undefined).eq('electionId', electionId),
      )
      .collect();
    const positions = await ctx.db
      .query('positions')
      .withIndex('by_deleted_election', (q) =>
        q.eq('deletedAt', undefined).eq('electionId', electionId),
      )
      .collect();

    const partylistsById = new Map(partylists.map((p) => [p._id, p]));
    const positionsById = new Map(positions.map((p) => [p._id, p]));

    return candidates.map((c) => ({
      ...c,
      partylist: partylistsById.get(c.partylistId) ?? null,
      position: positionsById.get(c.positionId) ?? null,
    }));
  },
});

export const create = mutation({
  args: {
    electionId: v.id('elections'),
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    slug: v.string(),
    positionId: v.id('positions'),
    partylistId: v.id('partylists'),
  },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx, args.electionId);

    const slug = args.slug.trim().toLowerCase();
    if (!slug) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Slug required',
      });
    }
    const conflict = await ctx.db
      .query('candidates')
      .withIndex('by_election_slug', (q) =>
        q.eq('electionId', args.electionId).eq('slug', slug),
      )
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (conflict) {
      throw new ConvexError({
        code: 'conflict',
        message: 'A candidate with that slug already exists.',
      });
    }

    // Each candidate has its own credentials row.
    const credentialId = await ctx.db.insert('credentials', {});

    return await ctx.db.insert('candidates', {
      slug,
      firstName: args.firstName.trim(),
      middleName: args.middleName?.trim() ?? undefined,
      lastName: args.lastName.trim(),
      electionId: args.electionId,
      positionId: args.positionId,
      partylistId: args.partylistId,
      credentialId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('candidates'),
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    slug: v.string(),
    positionId: v.id('positions'),
    partylistId: v.id('partylists'),
  },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.id);
    if (!candidate || candidate.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Candidate not found',
      });
    }
    await requireCommissioner(ctx, candidate.electionId);

    const slug = args.slug.trim().toLowerCase();
    if (slug !== candidate.slug) {
      const conflict = await ctx.db
        .query('candidates')
        .withIndex('by_election_slug', (q) =>
          q.eq('electionId', candidate.electionId).eq('slug', slug),
        )
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .first();
      if (conflict) {
        throw new ConvexError({
          code: 'conflict',
          message: 'A candidate with that slug already exists.',
        });
      }
    }

    await ctx.db.patch(args.id, {
      slug,
      firstName: args.firstName.trim(),
      middleName: args.middleName?.trim() ?? undefined,
      lastName: args.lastName.trim(),
      positionId: args.positionId,
      partylistId: args.partylistId,
    });
  },
});

export const softDelete = mutation({
  args: { id: v.id('candidates') },
  handler: async (ctx, { id }) => {
    const candidate = await ctx.db.get(id);
    if (!candidate || candidate.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Candidate not found',
      });
    }
    await requireCommissioner(ctx, candidate.electionId);
    await ctx.db.patch(id, { deletedAt: Date.now() });
  },
});
