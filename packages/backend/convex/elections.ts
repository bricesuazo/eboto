import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { internalMutation, mutation, query } from './_generated/server';
import {
  getElectionOrThrow,
  loadElectionForEdit,
  requireBeforeVotingOpens,
  requireChangeReason,
  requireCommissioner,
  requireUser,
  viewerHasElectionAccess,
} from './_helpers/auth';
import type { FieldSpec } from './_helpers/changeLog';
import {
  diffFields,
  formatDay,
  formatHour,
  formatNameArrangement,
  formatPublicity,
  formatToggle,
  recordElectionChange,
} from './_helpers/changeLog';
import { DEFAULT_TIMEZONE, votingEndAt } from './_helpers/election_timing';
import { isSlugReserved } from './_helpers/slugs';
import { getTemplatePositions } from './_helpers/templates';

/**
 * Default LemonSqueezy variant ID for free-tier elections. Replace with a
 * lookup against the `variants` table (or a Convex env var) once billing is
 * wired in.
 */
const DEFAULT_FREE_VARIANT_ID = 0;

/**
 * Validates and normalizes a client-supplied IANA timezone. Falls back to the
 * default when absent; throws on an unrecognized name so a typo can't silently
 * skew every scheduled time. Uses `Intl` (available in the Convex runtime).
 */
function resolveTimezone(timezone: string | undefined): string {
  const tz = timezone?.trim();
  if (!tz) return DEFAULT_TIMEZONE;
  try {
    // Throws RangeError for an invalid timezone identifier.
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    throw new ConvexError({
      code: 'invalid_argument',
      message: `Unknown timezone: ${tz}`,
    });
  }
}

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
      // The rule itself lives in `_helpers/auth.ts` so the change-log query
      // can't drift from the page its entries are published on.
      const hasAccess = await viewerHasElectionAccess(ctx, election, user);
      if (!hasAccess) {
        // PRIVATE elections must be indistinguishable from non-existent ones
        // to avoid leaking that they exist.
        if (election.publicity === 'PRIVATE') return null;
        // VOTER publicity: existence is non-secret. A signed-out viewer is
        // told to sign in (the page redirects to /sign-in with a return
        // path); a signed-in non-voter genuinely lacks access, so it 404s
        // (signing in again wouldn't help).
        if (!userId) {
          throw new ConvexError({
            code: 'requires_auth',
            message: 'Sign in to view this election',
          });
        }
        throw new ConvexError({
          code: 'unauthorized',
          message: 'You do not have access to this election',
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
          .query('voterFields')
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
      timezone: election.timezone ?? null,
      publicity: election.publicity,
      nameArrangement: election.nameArrangement,
      isCandidatesVisibleInRealtimeWhenOngoing:
        election.isCandidatesVisibleInRealtimeWhenOngoing,
      variantId: election.variantId,
      voterDomain: election.voterDomain ?? null,
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
 * requires the buyer to redeem one unused `electionsPlus` credit (granted
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
    timezone: v.optional(v.string()),
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
    let plusCreditToConsume: Id<'electionsPlus'> | null = null;
    if (activeOwned.length >= 1) {
      const credit = await ctx.db
        .query('electionsPlus')
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

    if (args.startDate > args.endDate) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'End date must be on or after start date.',
      });
    }
    if (
      args.votingHourStart < 0 ||
      args.votingHourStart > 23 ||
      args.votingHourEnd < 0 ||
      args.votingHourEnd > 23
    ) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Voting hours must be between 0 and 23.',
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
      timezone: resolveTimezone(args.timezone),
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

/**
 * Election fields a commissioner may still change once voting has opened.
 * Everything absent from this list is either immutable at that point (see the
 * locked-field check in the handler) or lives in its own mutation.
 */
const ELECTION_LOGGED_FIELDS: FieldSpec[] = [
  { key: 'name', label: 'Election name' },
  { key: 'description', label: 'Description' },
  { key: 'endDate', label: 'End date', format: formatDay },
  { key: 'votingHourEnd', label: 'Voting closes', format: formatHour },
  { key: 'publicity', label: 'Visibility', format: formatPublicity },
  {
    key: 'nameArrangement',
    label: 'Candidate name format',
    format: formatNameArrangement,
  },
  {
    key: 'isCandidatesVisibleInRealtimeWhenOngoing',
    label: 'Real names in live results',
    format: formatToggle,
  },
  { key: 'voterDomain', label: 'Voter email domain' },
];

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
    timezone: v.optional(v.string()),
    publicity: v.union(
      v.literal('PRIVATE'),
      v.literal('VOTER'),
      v.literal('PUBLIC'),
    ),
    nameArrangement: v.number(),
    isCandidatesVisibleInRealtimeWhenOngoing: v.boolean(),
    // Optional email-domain restriction. When set (e.g. "example.edu"),
    // voter registration rejects emails outside that domain. Empty string
    // clears the restriction.
    voterDomain: v.optional(v.string()),
    // Published alongside the diff once voting has opened. Ignored before.
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { election, votingStarted } = await loadElectionForEdit(ctx, args.id);
    const { userId } = await requireCommissioner(ctx, election._id);

    if (args.startDate > args.endDate) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'End must be on or after start',
      });
    }
    if (
      args.votingHourStart < 0 ||
      args.votingHourStart > 23 ||
      args.votingHourEnd < 0 ||
      args.votingHourEnd > 23
    ) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Voting hours must be between 0 and 23.',
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

    const voterDomain = args.voterDomain?.trim().toLowerCase() ?? '';
    if (voterDomain && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(voterDomain)) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Voter domain must look like "example.edu"',
      });
    }

    const timezone = resolveTimezone(args.timezone);

    if (votingStarted) {
      // These four can't move once ballots exist. The slug is in the list
      // because voters were emailed a link built from it; the other three
      // would redefine the window votes were already cast in.
      const locked: string[] = [];
      if (slug !== election.slug) {
        locked.push('the URL slug (voters were emailed links using it)');
      }
      if (args.startDate !== election.startDate) locked.push('the start date');
      if (args.votingHourStart !== election.votingHourStart) {
        locked.push('the opening hour');
      }
      if (timezone !== (election.timezone ?? DEFAULT_TIMEZONE)) {
        locked.push('the timezone');
      }
      if (locked.length > 0) {
        throw new ConvexError({
          code: 'forbidden',
          message: `Voting has started, so you can no longer change ${locked.join(', ')}. Everything else on this page is still editable and will be published to the change log.`,
        });
      }
      // Moving the close is allowed in both directions — extending is the
      // common case, and an election set to run far too long needs a way
      // back — but it can never land in the past, which would retroactively
      // close a window that voters were told was open.
      const newEnd = votingEndAt({
        startDate: args.startDate,
        endDate: args.endDate,
        votingHourStart: args.votingHourStart,
        votingHourEnd: args.votingHourEnd,
        timezone,
      });
      if (newEnd <= Date.now()) {
        throw new ConvexError({
          code: 'invalid_argument',
          message:
            'Voting must still close at some point in the future. Pick a later end date or closing hour.',
        });
      }
    }

    const patch = {
      name: args.name.trim(),
      slug,
      description: args.description.trim(),
      startDate: args.startDate,
      endDate: args.endDate,
      votingHourStart: args.votingHourStart,
      votingHourEnd: args.votingHourEnd,
      timezone,
      publicity: args.publicity,
      nameArrangement: args.nameArrangement,
      isCandidatesVisibleInRealtimeWhenOngoing:
        args.isCandidatesVisibleInRealtimeWhenOngoing,
      voterDomain: voterDomain || undefined,
    };

    // A no-op save (the form submits every field on every submit) shouldn't
    // demand a reason or add a log entry.
    const changes = votingStarted
      ? diffFields(election, patch, ELECTION_LOGGED_FIELDS)
      : [];
    const reason = requireChangeReason(args.reason, changes.length > 0);

    await ctx.db.patch(args.id, patch);

    if (changes.length > 0) {
      await recordElectionChange(ctx, {
        electionId: election._id,
        actorUserId: userId,
        entity: 'election',
        entityId: election._id,
        entityLabel: patch.name,
        action: 'update',
        changes,
        reason,
      });
    }

    return { slug };
  },
});

/**
 * Called by the Inngest start-of-election worker (via `voterBlast.runLifecycle`):
 * flips `PRIVATE` → `VOTER` so registered voters can actually load the page
 * once voting opens. No-ops on `VOTER`/`PUBLIC` so a commissioner who already
 * set a wider audience isn't overridden.
 */
export const openToVotersOnStart = internalMutation({
  args: { id: v.id('elections') },
  handler: async (ctx, { id }) => {
    const election = await ctx.db.get(id);
    if (!election || election.deletedAt) return { changed: false as const };
    if (election.publicity !== 'PRIVATE') return { changed: false as const };
    await ctx.db.patch(id, { publicity: 'VOTER' });
    return { changed: true as const };
  },
});

export const softDelete = mutation({
  args: { id: v.id('elections') },
  handler: async (ctx, { id }) => {
    const election = await getElectionOrThrow(ctx, id);
    await requireCommissioner(ctx, election._id);
    // Hard lock — and note this guard did not previously exist, so a live
    // election could be deleted outright. Nothing that gets logged can undo
    // making the whole election (and every ballot in it) inaccessible.
    await requireBeforeVotingOpens(ctx, id, 'deleting the election');
    await ctx.db.patch(id, { deletedAt: Date.now() });
  },
});

/**
 * Sets the election's logo. Pass `null` to remove. Old blob (if any) is
 * deleted so storage doesn't accumulate orphans on replace.
 *
 * Purely presentational, so it stays available after voting opens — logged
 * like any other post-start change.
 */
export const setLogo = mutation({
  args: {
    id: v.id('elections'),
    storageId: v.union(v.id('_storage'), v.null()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { id, storageId, reason: rawReason }) => {
    const { election, votingStarted } = await loadElectionForEdit(ctx, id);
    const { userId } = await requireCommissioner(ctx, id);

    const previous = election.logoStorageId;
    if (previous === (storageId ?? undefined)) return;

    const reason = requireChangeReason(rawReason, votingStarted);

    await ctx.db.patch(id, { logoStorageId: storageId ?? undefined });

    if (votingStarted) {
      await recordElectionChange(ctx, {
        electionId: election._id,
        actorUserId: userId,
        entity: 'election',
        entityId: election._id,
        entityLabel: election.name,
        action: 'update',
        // The image bytes themselves can't be shown in a text diff, so the
        // entry records that the logo moved and leaves the current one on
        // the page to speak for itself.
        changes: [
          {
            field: 'logo',
            label: 'Logo',
            before: previous ? 'A logo was set' : 'No logo',
            after: storageId ? 'Replaced with a new logo' : 'No logo',
          },
        ],
        reason,
      });
    }

    if (previous && previous !== storageId) {
      try {
        await ctx.storage.delete(previous);
      } catch {
        // best-effort; the new logo is already attached
      }
    }
  },
});
