/**
 * Read side of the election change log.
 *
 * Two queries, two audiences:
 *
 *   - {@link listForElection} — anyone who can see the election. This is what
 *     makes a post-start edit *transparent* rather than merely recorded.
 *   - {@link listForDashboard} — commissioners only. Same rows, nothing
 *     redacted.
 *
 * The redaction rule is deliberately narrow: only voter identities are
 * withheld, because publishing the roster is a privacy harm the log doesn't
 * need in order to do its job. A public reader still sees that voters were
 * added or removed, how many, by whom, when, and why.
 */
import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';

import type { Doc } from './_generated/dataModel';
import { query } from './_generated/server';
import { requireCommissioner, viewerHasElectionAccess } from './_helpers/auth';

/** Newest-first cap. One row per mutation, so this covers any realistic
 *  election with room to spare. */
const MAX_ENTRIES = 200;

function toPublicEntry(row: Doc<'electionChangeLogs'>) {
  const base = {
    _id: row._id,
    at: row._creationTime,
    actorName: row.actorName,
    entity: row.entity,
    action: row.action,
    reason: row.reason,
    count: row.count ?? null,
  };
  if (row.entity === 'voter') {
    // `entityLabel` is a voter email and `changes` can contain one, plus
    // whatever custom fields the election collects. Neither is published.
    return { ...base, entityLabel: null, changes: null };
  }
  return {
    ...base,
    entityLabel: row.entityLabel,
    changes: row.changes ?? null,
  };
}

/**
 * The election's public change log. Returns `null` when the election doesn't
 * exist or the viewer can't see it — matching how `elections.getBySlug`
 * treats the same cases, so this query never reveals an election the page
 * itself would hide.
 */
export const listForElection = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const election = await ctx.db
      .query('elections')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .filter((q) => q.eq(q.field('deletedAt'), undefined))
      .first();
    if (!election) return null;

    if (election.publicity !== 'PUBLIC') {
      const userId = await getAuthUserId(ctx);
      const user = userId ? await ctx.db.get(userId) : null;
      if (!(await viewerHasElectionAccess(ctx, election, user))) return null;
    }

    const rows = await ctx.db
      .query('electionChangeLogs')
      .withIndex('by_election', (q) => q.eq('electionId', election._id))
      .order('desc')
      .take(MAX_ENTRIES);

    return rows.map(toPublicEntry);
  },
});

/** Unredacted log for the commissioners who manage the election. */
export const listForDashboard = query({
  args: { electionId: v.id('elections') },
  handler: async (ctx, { electionId }) => {
    await requireCommissioner(ctx, electionId);

    const rows = await ctx.db
      .query('electionChangeLogs')
      .withIndex('by_election', (q) => q.eq('electionId', electionId))
      .order('desc')
      .take(MAX_ENTRIES);

    return rows.map((row) => ({
      _id: row._id,
      at: row._creationTime,
      actorName: row.actorName,
      actorEmail: row.actorEmail ?? null,
      entity: row.entity,
      entityLabel: row.entityLabel,
      action: row.action,
      changes: row.changes ?? null,
      reason: row.reason,
      count: row.count ?? null,
    }));
  },
});
