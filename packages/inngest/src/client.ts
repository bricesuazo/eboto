import { Inngest } from 'inngest';

import type { Id } from '@eboto/backend/data-model';

export const inngest = new Inngest({ id: 'eboto', });

export const ELECTION_LIFECYCLE_EVENT = 'eboto/election.lifecycle';

export interface ElectionLifecycleData {
  electionId: Id<'elections'>;
  slug: string;
  /** Absolute unix-ms moment we want the function to fire — already resolved
   *  in the election's `timezone` (below) by the caller. The lifecycle
   *  functions sleep on these directly; a timing/timezone change re-emits the
   *  event with fresh instants and `cancelOn` supersedes the stale run. */
  startAt: number;
  endAt: number;
  /** IANA timezone the dates/hours were interpreted in when `startAt`/`endAt`
   *  were resolved. Carried for reference (e.g. local-time email copy). */
  timezone: string;
}

/**
 * Helper for emitting the lifecycle event. Throws on failure so the caller
 * (the `scheduleElectionLifecycleFn` server fn) can report it back to the
 * browser instead of failing silently — a swallowed error here is invisible
 * because this runs server-side (e.g. a missing `INNGEST_ENV` for a branch
 * environment key 400s on every send). The caller keeps it non-blocking so a
 * flaky send can't fail the Convex write; a re-save re-emits the event.
 */
export async function scheduleElectionLifecycle(data: ElectionLifecycleData) {
  await inngest.send({ name: ELECTION_LIFECYCLE_EVENT, data });
}

/**
 * Resolves the Convex deployment URL the Inngest functions should hit.
 * Reads from process.env so this module doesn't depend on any app-level
 * env validator. Both `VITE_CONVEX_URL` and `CONVEX_URL` are accepted.
 */
export function convexUrlFromEnv(): string {
  const url = process.env.VITE_CONVEX_URL ?? process.env.CONVEX_URL;
  if (!url) {
    throw new Error(
      'Inngest function needs VITE_CONVEX_URL (or CONVEX_URL) to be set',
    );
  }
  return url;
}

/**
 * Shared secret that authenticates this worker when it calls
 * `api.voterBlast.runLifecycle`. Must match the value set on the Convex
 * deployment as `BLAST_TRIGGER_SECRET`.
 */
export function blastTriggerSecretFromEnv(): string {
  const secret = process.env.BLAST_TRIGGER_SECRET;
  if (!secret) {
    throw new Error(
      'Inngest function needs BLAST_TRIGGER_SECRET to call the voter blast',
    );
  }
  return secret;
}
