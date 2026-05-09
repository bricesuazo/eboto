import { ConvexHttpClient } from 'convex/browser';

import { api } from '@eboto/backend/api';

import type { ElectionLifecycleData } from '../client';
import {
    ELECTION_LIFECYCLE_EVENT,
    convexUrlFromEnv,
    inngest
} from '../client';

/**
 * Election lifecycle: one event triggers two functions, one fires on
 * `startAt`, one on `endAt`. Each function declares `cancelOn` matched on
 * `data.electionId` so a fresh emit (commissioner edits dates) aborts any
 * prior in-flight run for the same election.
 */
export const electionStarted = inngest.createFunction(
  {
    id: 'election-started',
    cancelOn: [
      { event: ELECTION_LIFECYCLE_EVENT, match: 'data.electionId' },
    ],
  },
  { event: ELECTION_LIFECYCLE_EVENT },
  async ({ event, step }) => {
    const { electionId, slug, startAt } = event.data as ElectionLifecycleData;
    await step.sleepUntil('wait-for-start', new Date(startAt));
    return await step.run('mark-started', async () => {
      const convex = new ConvexHttpClient(convexUrlFromEnv());
      const election = await convex.query(api.elections.getPublicById, {
        id: electionId,
      });
      if (!election) return { skipped: true } as const;
      return { startedAt: Date.now(), slug } as const;
    });
  },
);

export const electionEnded = inngest.createFunction(
  {
    id: 'election-ended',
    cancelOn: [
      { event: ELECTION_LIFECYCLE_EVENT, match: 'data.electionId' },
    ],
  },
  { event: ELECTION_LIFECYCLE_EVENT },
  async ({ event, step }) => {
    const { electionId, slug, endAt } = event.data as ElectionLifecycleData;
    await step.sleepUntil('wait-for-end', new Date(endAt));
    return await step.run('generate-turnout-report', async () => {
      const convex = new ConvexHttpClient(convexUrlFromEnv());
      const election = await convex.query(api.elections.getPublicById, {
        id: electionId,
      });
      if (!election) return { skipped: true } as const;
      await convex.action(api.results.generateTurnoutPdf, { electionId });
      return { endedAt: Date.now(), slug } as const;
    });
  },
);
