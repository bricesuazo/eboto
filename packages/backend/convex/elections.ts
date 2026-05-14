import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import { requireCommissioner, requireUser } from './_helpers/auth';
import { isSlugReserved } from './_helpers/slugs';
import { getTemplatePositions } from './_helpers/templates';

/**
 * Default LemonSqueezy variant ID for free-tier elections. Replace with a
 * lookup against the `variants` table (or a Convex env var) once billing is
 * wired in.
 */
const DEFAULT_FREE_VARIANT_ID = 0;

/**
 * Public-facing election landing query.
 *
 * Returns the election (with positions + candidates + partylists), or throws
 * a typed ConvexError when the viewer doesn't have access. Visibility rules
 * mirror the original Supabase implementation:
 *
 *   - PUBLIC  → anyone can read.
 *   - VOTER   → authenticated commissioners and registered voters only.
 *   - PRIVATE → authenticated commissioners only.
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const election = await ctx.db
      .query('elections')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();

    // Return null for 404 cases (keeps deployment logs clean). Reserve
    // ConvexError for actual error states the UI must distinguish.
    if (!election) return null;

    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;

    if (election.publicity !== 'PUBLIC') {
      const hasAccess = await viewerHasAccess(ctx, election, user);
      if (!hasAccess) {
        // PRIVATE elections must be indistinguishable from non-existent ones
        // to avoid leaking that they exist. VOTER access surfaces a hint to
        // sign in, since the existence is non-secret.
        if (election.publicity === 'PRIVATE') return null;
        throw new ConvexError({
          code: 'unauthorized',
          message: 'Sign in to view this election',
        });
      }
    }

    const [logoUrl, positions, partylists, candidates, voterFields] =
      await Promise.all([
        election.logoStorageId
          ? ctx.storage.getUrl(election.logoStorageId)
          : Promise.resolve(null),
        ctx.db
          .query('positions')
          .withIndex('by_deleted_election', (q) =>
            q.eq('deletedAt', undefined).eq('electionId', election._id),
          )
          .collect(),
        ctx.db
          .query('partylists')
          .withIndex('by_deleted_election', (q) =>
            q.eq('deletedAt', undefined).eq('electionId', election._id),
          )
          .collect(),
        ctx.db
          .query('candidates')
          .withIndex('by_election', (q) => q.eq('electionId', election._id))
          .filter((q) => q.eq(q.field('deletedAt'), undefined))
          .collect(),
        ctx.db
          .query('voter_fields')
          .withIndex('by_election', (q) => q.eq('electionId', election._id))
          .filter((q) => q.eq(q.field('deletedAt'), undefined))
          .collect(),
      ]);

    const partylistsById = new Map(partylists.map((p) => [p._id, p] as const));

    const candidatesWithImages = await Promise.all(
      candidates.map(async (c) => ({
        ...c,
        imageUrl: c.imageStorageId
          ? await ctx.storage.getUrl(c.imageStorageId)
          : null,
        partylist: partylistsById.get(c.partylistId) ?? null,
      })),
    );

    const positionsWithCandidates = positions
      .sort((a, b) => a.order - b.order)
      .map((position) => ({
        ...position,
        candidates: candidatesWithImages.filter(
          (c) => c.positionId === position._id,
        ),
      }));

    let isCommissioner = false;
    if (user) {
      const commissioner = await ctx.db
        .query('commissioners')
        .withIndex('by_user_election', (q) =>
          q.eq('userId', user._id).eq('electionId', election._id),
        )
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .first();
      isCommissioner = Boolean(commissioner);
    }

    let isVoter = false;
    let hasVoted = false;
    const userEmail = user?.email;
    if (userEmail) {
      const voter = await ctx.db
        .query('voters')
        .withIndex('by_election_email', (q) =>
          q.eq('electionId', election._id).eq('email', userEmail),
        )
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .first();
      isVoter = Boolean(voter);
      if (voter) {
        const existingVote = await ctx.db
          .query('votes')
          .withIndex('by_election_voter', (q) =>
            q.eq('electionId', election._id).eq('voterId', voter._id),
          )
          .first();
        hasVoted = Boolean(existingVote);
      }
    }

    return {
      election: { ...election, logoUrl, voterFields },
      positions: positionsWithCandidates,
      isCommissioner,
      isVoter,
      hasVoted,
    };
  },
});

async function viewerHasAccess(
  ctx: QueryCtx,
  election: Doc<'elections'>,
  user: Doc<'users'> | null,
) {
  if (!user) return false;

  const commissioner = await ctx.db
    .query('commissioners')
    .withIndex('by_user_election', (q) =>
      q.eq('userId', user._id).eq('electionId', election._id),
    )
    .filter((q) => q.eq(q.field('deletedAt'), undefined))
    .first();

  if (commissioner) return true;

  const email = user.email;

  if (election.publicity === 'VOTER' && email) {
    const voter = await ctx.db
      .query('voters')
      .withIndex('by_election_email', (q) =>
        q.eq('electionId', election._id).eq('email', email),
      )
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (voter) return true;
  }

  return false;
}

// Re-exported helper used elsewhere; flagged with the Id<> generic.
export type ElectionId = Id<'elections'>;

/**
 * Minimal lookup used by Inngest functions to re-validate election dates
 * before firing side-effects (so a moved start/end can cancel out a stale
 * scheduled run). No auth — Inngest runs server-side in our infra.
 */
export const getPublicById = query({
  args: { id: v.id('elections') },
  handler: async (ctx, { id }) => {
    const election = await ctx.db.get(id);
    if (!election || election.deletedAt) return null;
    return {
      _id: election._id,
      slug: election.slug,
      name: election.name,
      startDate: election.startDate,
      endDate: election.endDate,
    };
  },
});

/**
 * Aggregate stats for the dashboard overview: turnout breakdown, entity
 * counts, and a setup checklist. Caller must be a commissioner.
 */
export const getDashboardStats = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const election = await ctx.db
      .query('elections')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (!election) return null;
    await requireCommissioner(ctx, election._id);

    const [voters, partylists, positions, candidates, voteRows] =
      await Promise.all([
        ctx.db
          .query('voters')
          .withIndex('by_election', (q) => q.eq('electionId', election._id))
          .filter((q) => q.eq(q.field('deletedAt'), undefined))
          .collect(),
        ctx.db
          .query('partylists')
          .withIndex('by_deleted_election', (q) =>
            q.eq('deletedAt', undefined).eq('electionId', election._id),
          )
          .collect(),
        ctx.db
          .query('positions')
          .withIndex('by_deleted_election', (q) =>
            q.eq('deletedAt', undefined).eq('electionId', election._id),
          )
          .collect(),
        ctx.db
          .query('candidates')
          .withIndex('by_election', (q) => q.eq('electionId', election._id))
          .filter((q) => q.eq(q.field('deletedAt'), undefined))
          .collect(),
        ctx.db
          .query('votes')
          .withIndex('by_election_voter', (q) =>
            q.eq('electionId', election._id),
          )
          .collect(),
      ]);

    const votedVoterIds = new Set(voteRows.map((v) => v.voterId));
    const totalVoters = voters.length;
    const totalVoted = voters.filter((v) => votedVoterIds.has(v._id)).length;

    const now = Date.now();
    return {
      election: {
        _id: election._id,
        name: election.name,
        slug: election.slug,
        startDate: election.startDate,
        endDate: election.endDate,
        publicity: election.publicity,
      },
      turnout: {
        total: totalVoters,
        voted: totalVoted,
        notVoted: Math.max(totalVoters - totalVoted, 0),
        percent:
          totalVoters === 0
            ? 0
            : Math.round((totalVoted / totalVoters) * 1000) / 10,
      },
      counts: {
        partylists: partylists.length,
        positions: positions.length,
        candidates: candidates.length,
        voters: totalVoters,
      },
      checklist: {
        hasPartylist: partylists.length > 0,
        hasPosition: positions.length > 0,
        hasCandidate: candidates.length > 0,
        hasVoter: voters.length > 0,
        hasStarted: now >= election.startDate,
        hasEnded: now >= election.endDate,
      },
    };
  },
});

/**
 * Dashboard query — loads the election shell data for the commissioner UI
 * (id, slug, name, voter quota fields). Throws not_found when the caller
 * isn't a commissioner of this election.
 */
export const getDashboardBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const election = await ctx.db
      .query('elections')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (!election) return null;

    await requireCommissioner(ctx, election._id);

    const logoUrl = election.logoStorageId
      ? await ctx.storage.getUrl(election.logoStorageId)
      : null;

    return {
      _id: election._id,
      slug: election.slug,
      name: election.name,
      description: election.description,
      startDate: election.startDate,
      endDate: election.endDate,
      votingHourStart: election.votingHourStart,
      votingHourEnd: election.votingHourEnd,
      publicity: election.publicity,
      nameArrangement: election.nameArrangement,
      isCandidatesVisibleInRealtimeWhenOngoing:
        election.isCandidatesVisibleInRealtimeWhenOngoing,
      variantId: election.variantId,
      logoUrl,
    };
  },
});

/**
 * Creates an election + auto-creates a commissioner row + an "Independent"
 * partylist + (optionally) seeds positions from a template. The whole thing
 * runs inside a single Convex mutation, so a failure in any step rolls
 * everything back.
 *
 * Quota: each account gets one free election. Every election after that
 * requires the buyer to redeem one unused `elections_plus` credit (granted
 * by the LemonSqueezy webhook on Plus purchase).
 */
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    votingHourStart: v.number(),
    votingHourEnd: v.number(),
    template: v.string(),
    logoStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const slug = args.slug.trim().toLowerCase();
    if (!slug || isSlugReserved(slug)) {
      throw new ConvexError({
        code: 'conflict',
        message: 'That slug is reserved. Please choose another.',
      });
    }

    const existing = await ctx.db
      .query('elections')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (existing) {
      throw new ConvexError({
        code: 'conflict',
        message: 'An election with that slug already exists.',
      });
    }

    // One free election per account. Any further election must consume a
    // Plus credit — looked up here so the failure mode is a clean
    // "buy Plus" message instead of silently inserting and double-billing.
    const ownedElections = await ctx.db
      .query('commissioners')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .collect();
    const activeOwned: typeof ownedElections = [];
    for (const c of ownedElections) {
      const election = await ctx.db.get(c.electionId);
      if (election && !election.deletedAt) activeOwned.push(c);
    }
    let plusCreditToConsume: Id<'elections_plus'> | null = null;
    if (activeOwned.length >= 1) {
      const credit = await ctx.db
        .query('elections_plus')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .filter((q) =>
          q.and(
            q.eq(q.field('redeemedAt'), undefined),
            q.eq(q.field('deletedAt'), undefined),
          ),
        )
        .first();
      if (!credit) {
        throw new ConvexError({
          code: 'forbidden',
          message:
            'You already have an election. Purchase Plus to add another.',
        });
      }
      plusCreditToConsume = credit._id;
    }

    if (args.startDate >= args.endDate) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'End date must be after start date.',
      });
    }
    if (
      args.votingHourStart < 0 ||
      args.votingHourStart > 24 ||
      args.votingHourEnd < 0 ||
      args.votingHourEnd > 24
    ) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Invalid voting hours.',
      });
    }
    if (args.votingHourEnd <= args.votingHourStart) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'End hour must be after start hour.',
      });
    }

    const electionId = await ctx.db.insert('elections', {
      slug,
      name: args.name,
      description: '',
      startDate: args.startDate,
      endDate: args.endDate,
      votingHourStart: args.votingHourStart,
      votingHourEnd: args.votingHourEnd,
      publicity: 'PRIVATE',
      isCandidatesVisibleInRealtimeWhenOngoing: false,
      nameArrangement: 0,
      variantId: DEFAULT_FREE_VARIANT_ID,
      logoStorageId: args.logoStorageId,
    });

    await ctx.db.insert('commissioners', { userId, electionId });

    await ctx.db.insert('partylists', {
      name: 'Independent',
      acronym: 'IND',
      electionId,
    });

    const positions = getTemplatePositions(args.template);
    for (const [order, name] of positions.entries()) {
      await ctx.db.insert('positions', {
        name,
        order,
        min: 0,
        max: 1,
        electionId,
      });
    }

    if (plusCreditToConsume) {
      await ctx.db.patch(plusCreditToConsume, { redeemedAt: Date.now() });
    }

    return { electionId, slug };
  },
});

export const update = mutation({
  args: {
    id: v.id('elections'),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    votingHourStart: v.number(),
    votingHourEnd: v.number(),
    publicity: v.union(
      v.literal('PRIVATE'),
      v.literal('VOTER'),
      v.literal('PUBLIC'),
    ),
    nameArrangement: v.number(),
    isCandidatesVisibleInRealtimeWhenOngoing: v.boolean(),
  },
  handler: async (ctx, args) => {
    const election = await ctx.db.get(args.id);
    if (!election || election.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Election not found',
      });
    }
    await requireCommissioner(ctx, election._id);

    if (args.startDate >= args.endDate) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'End must be after start',
      });
    }
    if (args.votingHourEnd <= args.votingHourStart) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'End hour must be after start hour.',
      });
    }

    const slug = args.slug.trim().toLowerCase();
    if (!slug || isSlugReserved(slug)) {
      throw new ConvexError({
        code: 'conflict',
        message: 'That slug is reserved. Please choose another.',
      });
    }
    if (slug !== election.slug) {
      const collision = await ctx.db
        .query('elections')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .first();
      if (collision && collision._id !== election._id) {
        throw new ConvexError({
          code: 'conflict',
          message: 'An election with that slug already exists.',
        });
      }
    }

    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      slug,
      description: args.description.trim(),
      startDate: args.startDate,
      endDate: args.endDate,
      votingHourStart: args.votingHourStart,
      votingHourEnd: args.votingHourEnd,
      publicity: args.publicity,
      nameArrangement: args.nameArrangement,
      isCandidatesVisibleInRealtimeWhenOngoing:
        args.isCandidatesVisibleInRealtimeWhenOngoing,
    });

    return { slug };
  },
});

export const softDelete = mutation({
  args: { id: v.id('elections') },
  handler: async (ctx, { id }) => {
    const election = await ctx.db.get(id);
    if (!election || election.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Election not found',
      });
    }
    await requireCommissioner(ctx, id);
    await ctx.db.patch(id, { deletedAt: Date.now() });
  },
});

/**
 * Sets the election's logo. Pass `null` to remove. Old blob (if any) is
 * deleted so storage doesn't accumulate orphans on replace.
 */
export const setLogo = mutation({
  args: {
    id: v.id('elections'),
    storageId: v.union(v.id('_storage'), v.null()),
  },
  handler: async (ctx, { id, storageId }) => {
    await requireCommissioner(ctx, id);

    const election = await ctx.db.get(id);
    if (!election || election.deletedAt) {
      throw new ConvexError({
        code: 'not_found',
        message: 'Election not found',
      });
    }
    const previous = election.logoStorageId;
    await ctx.db.patch(id, { logoStorageId: storageId ?? undefined });
    if (previous && previous !== storageId) {
      try {
        await ctx.storage.delete(previous);
      } catch {
        // best-effort; the new logo is already attached
      }
    }
  },
});
