import { paginationOptsValidator } from 'convex/server';
import { ConvexError, v } from 'convex/values';

import { internalQuery, query } from './_generated/server';
import {
  requireCommissioner,
  requireElectionEditable,
} from './_helpers/auth';
import { getElectionTier } from './_helpers/billing';
import {
  internalMutation,
  mutation,
  rawInternalMutation,
} from './_helpers/triggers';
import { votedByElection, votersByElection } from './aggregates';
import { voterNotificationPhase } from './schema';
import type { Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';

/**
 * Resolves the voter cap for an election from its billing tier. Returns
 * `null` when the election is on the unlimited (-1) tier. Throws when the
 * election is missing/deleted.
 */
async function getVoterCap(ctx: MutationCtx, electionId: Id<'elections'>) {
  const election = await ctx.db.get(electionId);
  if (!election || election.deletedAt) {
    throw new ConvexError({
      code: 'not_found',
      message: 'Election not found',
    });
  }
  const tier = getElectionTier(election);
  if (tier.voterCap === -1) return null;
  return tier.voterCap;
}

/**
 * When the election has a `voterDomain` set, voter emails must match that
 * domain (case-insensitive, ignoring an optional leading "@"). Returns the
 * normalized domain string or `null` when no restriction applies.
 */
function emailMatchesDomain(email: string, domain: string | undefined) {
  if (!domain) return true;
  const at = email.lastIndexOf('@');
  if (at < 0) return false;
  const emailDomain = email.slice(at + 1).toLowerCase();
  return emailDomain === domain.toLowerCase().replace(/^@/, '');
}

async function currentVoterCount(
  ctx: MutationCtx,
  electionId: Id<'elections'>,
) {
  return await votersByElection.count(ctx, {
    namespace: electionId,
    bounds: {},
  });
}

const statusFilter = v.union(
  v.literal('all'),
  v.literal('voted'),
  v.literal('pending'),
);

/**
 * Paginated voter listing for the dashboard.
 *
 * - When `search` is non-empty, results come from a search index over email.
 *   The `status` filter is ignored in this mode (page sizes are bounded, so
 *   the client can filter the page if needed).
 * - Otherwise rows come from the `by_election_voted` index so voted/pending
 *   filtering hits an index instead of scanning.
 */
export const listPaginated = query({
  args: {
    electionId: v.id('elections'),
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    status: v.optional(statusFilter),
  },
  handler: async (ctx, { electionId, paginationOpts, search, status }) => {
    await requireCommissioner(ctx, electionId);
    const trimmed = search?.trim() ?? '';

    if (trimmed) {
      return await ctx.db
        .query('voters')
        .withSearchIndex('search_email', (q) =>
          q
            .search('email', trimmed)
            .eq('electionId', electionId)
            .eq('deletedAt', undefined),
        )
        .paginate(paginationOpts);
    }

    const effectiveStatus = status ?? 'all';
    if (effectiveStatus === 'pending') {
      return await ctx.db
        .query('voters')
        .withIndex('by_election_voted', (q) =>
          q.eq('electionId', electionId).eq('votedAt', undefined),
        )
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .paginate(paginationOpts);
    }
    if (effectiveStatus === 'voted') {
      return await ctx.db
        .query('voters')
        .withIndex('by_election_voted', (q) =>
          q.eq('electionId', electionId).gt('votedAt', undefined),
        )
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .paginate(paginationOpts);
    }
    return await ctx.db
      .query('voters')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .paginate(paginationOpts);
  },
});

/**
 * Returns O(log n) counts via the aggregate component, so the dashboard
 * header stays fast even at very large voter counts.
 */
export const stats = query({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);
    const [total, voted] = await Promise.all([
      votersByElection.count(ctx, { namespace: electionId, bounds: {} }),
      votedByElection.count(ctx, { namespace: electionId, bounds: {} }),
    ]);
    return {
      total,
      voted,
      pending: Math.max(total - voted, 0),
    };
  },
});

/**
 * Returns every voter in an election (capped at the current max voter tier of
 * 10k) for CSV download. Commissioner-only. Includes `votedAt` so the export
 * can be used as a participation list. Custom-field shapes vary per
 * election, so this returns the raw `field` blob and the client flattens it.
 */
export const listForExport = query({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);
    const rows = await ctx.db
      .query('voters')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .take(10_000);
    return rows.map((v) => ({
      email: v.email,
      votedAt: v.votedAt ?? null,
      field: (v.field as Record<string, string> | undefined) ?? null,
    }));
  },
});

export const create = mutation({
  args: {
    electionId: v.id('elections'),
    email: v.string(),
    fields: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, { electionId, email, fields }) => {
    await requireCommissioner(ctx, electionId);
    const election = await requireElectionEditable(ctx, electionId);
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Email required',
      });
    }
    if (!emailMatchesDomain(normalized, election.voterDomain)) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: `Email must be in the @${election.voterDomain} domain.`,
      });
    }
    const conflict = await ctx.db
      .query('voters')
      .withIndex('by_election_email', (q) =>
        q.eq('electionId', electionId).eq('email', normalized),
      )
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (conflict) {
      throw new ConvexError({
        code: 'conflict',
        message: 'That voter is already registered.',
      });
    }
    const cap = await getVoterCap(ctx, electionId);
    if (cap !== null && (await currentVoterCount(ctx, electionId)) >= cap) {
      throw new ConvexError({
        code: 'forbidden',
        message: `Voter cap reached (${cap}). Upgrade to Boost to add more.`,
      });
    }
    const hasFields =
      fields && Object.keys(fields).length > 0 ? fields : undefined;
    return await ctx.db.insert('voters', {
      electionId,
      email: normalized,
      ...(hasFields ? { field: hasFields } : {}),
    });
  },
});

export const bulkCreate = mutation({
  args: {
    electionId: v.id('elections'),
    voters: v.array(
      v.object({
        email: v.string(),
        fields: v.optional(v.record(v.string(), v.string())),
      }),
    ),
  },
  handler: async (ctx, { electionId, voters }) => {
    await requireCommissioner(ctx, electionId);
    const election = await requireElectionEditable(ctx, electionId);

    const cap = await getVoterCap(ctx, electionId);
    let remaining =
      cap === null
        ? Number.POSITIVE_INFINITY
        : Math.max(cap - (await currentVoterCount(ctx, electionId)), 0);

    let added = 0;
    const skipped: string[] = [];
    const domainRejected: string[] = [];
    const seenInBatch = new Set<string>();
    for (const raw of voters) {
      const email = raw.email.trim().toLowerCase();
      if (!email || seenInBatch.has(email)) {
        if (email) skipped.push(email);
        continue;
      }
      seenInBatch.add(email);

      if (!emailMatchesDomain(email, election.voterDomain)) {
        domainRejected.push(email);
        continue;
      }

      const conflict = await ctx.db
        .query('voters')
        .withIndex('by_election_email', (q) =>
          q.eq('electionId', electionId).eq('email', email),
        )
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .first();
      if (conflict) {
        skipped.push(email);
        continue;
      }

      if (remaining <= 0) {
        skipped.push(email);
        continue;
      }
      const hasFields =
        raw.fields && Object.keys(raw.fields).length > 0
          ? raw.fields
          : undefined;
      await ctx.db.insert('voters', {
        electionId,
        email,
        ...(hasFields ? { field: hasFields } : {}),
      });
      added++;
      remaining--;
    }

    return {
      added,
      skipped,
      domainRejected,
      capReached: remaining <= 0 && cap !== null,
    };
  },
});

export const update = mutation({
  args: {
    id: v.id('voters'),
    email: v.string(),
    fields: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, { id, email, fields }) => {
    const voter = await ctx.db.get(id);
    if (!voter || voter.deletedAt) {
      throw new ConvexError({ code: 'not_found', message: 'Voter not found' });
    }
    await requireCommissioner(ctx, voter.electionId);
    await requireElectionEditable(ctx, voter.electionId);
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Email required',
      });
    }
    if (normalized !== voter.email) {
      const conflict = await ctx.db
        .query('voters')
        .withIndex('by_election_email', (q) =>
          q.eq('electionId', voter.electionId).eq('email', normalized),
        )
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .first();
      if (conflict && conflict._id !== id) {
        throw new ConvexError({
          code: 'conflict',
          message: 'That email is already registered.',
        });
      }
    }
    const hasFields =
      fields && Object.keys(fields).length > 0 ? fields : undefined;
    await ctx.db.patch(id, {
      email: normalized,
      field: hasFields,
    });
  },
});

export const softDelete = mutation({
  args: { id: v.id('voters') },
  handler: async (ctx, { id }) => {
    const voter = await ctx.db.get(id);
    if (!voter || voter.deletedAt) {
      throw new ConvexError({ code: 'not_found', message: 'Voter not found' });
    }
    await requireCommissioner(ctx, voter.electionId);
    await requireElectionEditable(ctx, voter.electionId);
    await ctx.db.patch(id, { deletedAt: Date.now() });
  },
});

// A trigger registered on the `voters` table keeps both aggregates in sync
// with every insert/patch/delete (see ./_helpers/triggers.ts). Handlers above
// don't need to call the aggregates explicitly.

/**
 * One-shot backfill: sets `votedAt` from existing votes and (re)populates the
 * aggregate component. Run once after deploy via
 * `npx convex run voters:backfillAggregates`.
 *
 * Uses `rawInternalMutation` to bypass triggers — backfill manages aggregate
 * state directly (clear + insert), and we don't want each patch to also fire
 * the trigger.
 *
 * Paginated by election to stay within per-mutation limits — call repeatedly
 * until `done: true`. The aggregate is cleared per-namespace before refill,
 * so it's safe to re-run.
 */
export const backfillAggregates = rawInternalMutation({
  args: { cursor: v.optional(v.string()) },
  handler: async (ctx, { cursor }) => {
    const page = await ctx.db
      .query('elections')
      .paginate({ numItems: 1, cursor: cursor ?? null });
    for (const election of page.page) {
      await votersByElection.clear(ctx, { namespace: election._id });
      await votedByElection.clear(ctx, { namespace: election._id });

      const voters = await ctx.db
        .query('voters')
        .withIndex('by_election', (q) => q.eq('electionId', election._id))
        .filter((q) => q.eq(q.field('deletedAt'), undefined))
        .collect();
      for (const voter of voters) {
        let resolved = voter;
        if (!resolved.votedAt) {
          const firstVote = await ctx.db
            .query('votes')
            .withIndex('by_election_voter', (q) =>
              q.eq('electionId', election._id).eq('voterId', voter._id),
            )
            .first();
          if (firstVote) {
            await ctx.db.patch(voter._id, {
              votedAt: firstVote._creationTime,
            });
            const refreshed = await ctx.db.get(voter._id);
            if (refreshed) resolved = refreshed;
          }
        }
        await votersByElection.insertIfDoesNotExist(ctx, resolved);
        if (resolved.votedAt) {
          await votedByElection.insertIfDoesNotExist(ctx, resolved);
        }
      }
    }
    return {
      done: page.isDone,
      cursor: page.continueCursor,
    };
  },
});

// `internalMutation` is re-exported so other Convex files can write voters
// via the triggered factory if needed in the future.
export { internalMutation };

/* ------------------------------------------------------------------ */
/* Lifecycle email blast                                                */
/* ------------------------------------------------------------------ */

/**
 * Paginated voter listing used by the Inngest lifecycle fan-out. Returns
 * only the columns needed to enqueue per-voter email events so the worker
 * doesn't pull voter custom fields it won't use.
 *
 * Marked `internal` because the Inngest function calls it via an admin
 * Convex client — no per-user auth needed (or available) at that layer.
 */
export const listForBlast = internalQuery({
  args: {
    electionId: v.id('elections'),
    cursor: v.optional(v.union(v.string(), v.null())),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, { electionId, cursor, pageSize }) => {
    const page = await ctx.db
      .query('voters')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .paginate({ numItems: pageSize ?? 200, cursor: cursor ?? null });
    return {
      voters: page.page.map((v) => ({ _id: v._id, email: v.email })),
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});

/**
 * Internal lookup the Inngest sender uses to skip voters that have already
 * been notified for a phase. Cheap due to the dedicated index.
 */
export const getNotification = internalQuery({
  args: {
    electionId: v.id('elections'),
    voterId: v.id('voters'),
    phase: voterNotificationPhase,
  },
  handler: async (ctx, { electionId, voterId, phase }) => {
    return await ctx.db
      .query('voterNotifications')
      .withIndex('by_election_voter_phase', (q) =>
        q
          .eq('electionId', electionId)
          .eq('voterId', voterId)
          .eq('phase', phase),
      )
      .first();
  },
});

/**
 * Voter lookup for the Inngest sender. Returns null when the voter has
 * been soft-deleted between fan-out and send so the handler can no-op.
 */
export const getForBlast = internalQuery({
  args: { voterId: v.id('voters') },
  handler: async (ctx, { voterId }) => {
    const voter = await ctx.db.get(voterId);
    if (!voter || voter.deletedAt) return null;
    return {
      _id: voter._id,
      email: voter.email,
      electionId: voter.electionId,
    };
  },
});

/**
 * Records the outcome of a single per-voter send. The pre-check on
 * `by_election_voter_phase` plus this insert make the send effectively
 * idempotent: if two parallel attempts race, the second sees the existing
 * row and skips.
 */
export const recordNotification = internalMutation({
  args: {
    electionId: v.id('elections'),
    voterId: v.id('voters'),
    phase: voterNotificationPhase,
    status: v.union(v.literal('sent'), v.literal('failed')),
    providerId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { electionId, voterId, phase, status, providerId, error },
  ) => {
    const existing = await ctx.db
      .query('voterNotifications')
      .withIndex('by_election_voter_phase', (q) =>
        q
          .eq('electionId', electionId)
          .eq('voterId', voterId)
          .eq('phase', phase),
      )
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert('voterNotifications', {
      electionId,
      voterId,
      phase,
      status,
      providerId,
      error,
      sentAt: Date.now(),
    });
  },
});