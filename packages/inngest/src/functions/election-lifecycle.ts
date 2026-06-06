import { ConvexHttpClient } from 'convex/browser';

import { api } from '@eboto/backend/api';

import type { ElectionLifecycleData } from '../client';
import {
    ELECTION_LIFECYCLE_EVENT,
    blastTriggerSecretFromEnv,
    convexUrlFromEnv,
    inngest
} from '../client';

/**
 * Election lifecycle: one event triggers two functions, one fires on
 * `startAt`, one on `endAt`. Each function declares `cancelOn` matched on
 * `data.electionId` so a fresh emit (commissioner edits dates/timezone) aborts
 * any prior in-flight run for the same election.
 *
 * The fire moments (`startAt` / `endAt`) are taken straight from the event —
 * the scheduler already resolved them in the election's timezone before
 * emitting, so there's no need to re-read the database here. A timing or
 * timezone change re-emits the event with fresh instants, and `cancelOn`
 * supersedes the stale run.
 *
 * After waking up, both functions delegate the voter email blast to a
 * Convex action (`api.voterBlast.runLifecycle`). The action fans out
 * batches of ~50 emails via `ctx.scheduler` and sends them through AWS
 * SES v2 so voter PII never leaves the Convex deployment.
 * `voterNotifications` rows guard against double-sends on retry.
 */
export const electionStarted = inngest.createFunction(
  {
    id: 'election-started',
    triggers: [{ event: ELECTION_LIFECYCLE_EVENT }],
    cancelOn: [
      { event: ELECTION_LIFECYCLE_EVENT, match: 'data.electionId' },
    ],
  },
  async ({ event, step }) => {
    const { electionId, slug, startAt } = event.data as ElectionLifecycleData;
    await step.sleepUntil('wait-for-start', new Date(startAt));
    return await step.run('blast-start', async () => {
      const convex = new ConvexHttpClient(convexUrlFromEnv());
      const election = await convex.query(api.elections.getPublicById, {
        id: electionId,
      });
      if (!election) return { skipped: true, slug } as const;
      const result = await convex.action(api.voterBlast.runLifecycle, {
        electionId,
        phase: 'start',
        secret: blastTriggerSecretFromEnv(),
      });
      return { startedAt: Date.now(), slug, blast: result } as const;
    });
  },
);

export const electionEnded = inngest.createFunction(
  {
    id: 'election-ended',
    triggers: [{ event: ELECTION_LIFECYCLE_EVENT }],
    cancelOn: [
      { event: ELECTION_LIFECYCLE_EVENT, match: 'data.electionId' },
    ],
  },
  async ({ event, step }) => {
    const { electionId, slug, endAt } = event.data as ElectionLifecycleData;
    await step.sleepUntil('wait-for-end', new Date(endAt));

    const blastResult = await step.run('blast-end', async () => {
      const convex = new ConvexHttpClient(convexUrlFromEnv());
      const election = await convex.query(api.elections.getPublicById, {
        id: electionId,
      });
      if (!election) return { skipped: true } as const;
      return await convex.action(api.voterBlast.runLifecycle, {
        electionId,
        phase: 'end',
        secret: blastTriggerSecretFromEnv(),
      });
    });

    return await step.run('generate-turnout-report', async () => {
      const convex = new ConvexHttpClient(convexUrlFromEnv());
      const election = await convex.query(api.elections.getPublicById, {
        id: electionId,
      });
      if (!election) return { skipped: true, slug, blast: blastResult } as const;
      await convex.action(api.results.generateTurnoutPdf, { electionId });
      return { endedAt: Date.now(), slug, blast: blastResult } as const;
    });
  },
);
