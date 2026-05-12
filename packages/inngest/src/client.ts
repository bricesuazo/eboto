import { Inngest } from 'inngest';

import type { Id } from '@eboto/backend/data-model';

export const inngest = new Inngest({ id: 'eboto' });

export const ELECTION_LIFECYCLE_EVENT = 'eboto/election.lifecycle';

export interface ElectionLifecycleData {
  electionId: Id<'elections'>;
  slug: string;
  /** Absolute unix-ms moment we want the function to fire — already
   *  rolled forward to the voting-hour boundary by the caller. */
  startAt: number;
  endAt: number;
}

/**
 * Helper for emitting the lifecycle event. Failures are logged but
 * swallowed so a flaky Inngest connection can't block a Convex write.
 * A retry on the next edit re-emits the event.
 */
export async function scheduleElectionLifecycle(data: ElectionLifecycleData) {
  try {
    await inngest.send({ name: ELECTION_LIFECYCLE_EVENT, data });
  } catch (err) {
    console.warn('inngest schedule failed', err);
  }
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
