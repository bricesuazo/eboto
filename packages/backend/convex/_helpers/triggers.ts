import {
  customCtx,
  customMutation,
} from 'convex-helpers/server/customFunctions';
import { Triggers } from 'convex-helpers/server/triggers';

import type { DataModel } from '../_generated/dataModel';
import {
  internalMutation as rawInternalMutation,
  mutation as rawMutation,
} from '../_generated/server';
import { votedByElection, votersByElection } from '../aggregates';

const triggers = new Triggers<DataModel>();

/**
 * Auto-syncs the two voter aggregates with the `voters` table.
 *
 * Membership rules:
 *   - votersByElection: voter is live (deletedAt undefined)
 *   - votedByElection: voter is live AND has votedAt set
 *
 * The trigger inspects oldDoc/newDoc to detect deletedAt and votedAt
 * transitions and inserts/deletes from the matching aggregate. Plain edits
 * (email, fields) flow through with no aggregate writes since both keys are
 * `null` and membership doesn't change.
 */
triggers.register('voters', async (ctx, change) => {
  const wasLive = !!change.oldDoc && !change.oldDoc.deletedAt;
  const isLive = !!change.newDoc && !change.newDoc.deletedAt;

  if (!wasLive && isLive) {
    await votersByElection.insert(ctx, change.newDoc);
  } else if (wasLive && !isLive) {
    await votersByElection.delete(ctx, change.oldDoc);
  }

  const wasVoted = wasLive && !!change.oldDoc.votedAt;
  const isVoted = isLive && !!change.newDoc.votedAt;

  if (!wasVoted && isVoted) {
    await votedByElection.insert(ctx, change.newDoc);
  } else if (wasVoted && !isVoted) {
    await votedByElection.delete(ctx, change.oldDoc);
  }
});

/**
 * Use these triggered mutation factories in place of the raw `_generated/server`
 * exports. Any `ctx.db` write to `voters` will fan out to the aggregates
 * automatically — handlers no longer need to remember the aggregate calls.
 *
 * Exception: the one-shot backfill mutation uses `rawInternalMutation` so it
 * can clear and rebuild aggregates directly without the trigger fighting it.
 */
export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
export const internalMutation = customMutation(
  rawInternalMutation,
  customCtx(triggers.wrapDB),
);

export { rawInternalMutation, rawMutation };
