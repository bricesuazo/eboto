import { paginationOptsValidator } from 'convex/server';
import { ConvexError, v } from 'convex/values';

import { query } from './_generated/server';
import { requireCommissioner } from './_helpers/auth';
import {
  internalMutation,
  mutation,
  rawInternalMutation,
} from './_helpers/triggers';
import { votedByElection, votersByElection } from './aggregates';

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

export const create = mutation({
  args: {
    electionId: v.id('elections'),
    email: v.string(),
    fields: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, { electionId, email, fields }) => {
    await requireCommissioner(ctx, electionId);
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      throw new ConvexError({
        code: 'invalid_argument',
        message: 'Email required',
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

    let added = 0;
    const skipped: string[] = [];
    const seenInBatch = new Set<string>();
    for (const raw of voters) {
      const email = raw.email.trim().toLowerCase();
      if (!email || seenInBatch.has(email)) {
        if (email) skipped.push(email);
        continue;
      }
      seenInBatch.add(email);

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
    }

    return { added, skipped };
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
