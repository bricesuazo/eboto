import { createServerFn } from '@tanstack/react-start';

import type { Id } from '@eboto/backend/data-model';

import { scheduleElectionLifecycle } from '~/server/inngest';

interface ScheduleInput {
  electionId: Id<'elections'>;
  slug: string;
  /** Absolute unix-ms — must already include voting-hour-of-day. */
  startAt: number;
  endAt: number;
}

/**
 * Server fn called by election create/update flows to send the lifecycle
 * event to Inngest. Lives client-callable so we can fire it after the
 * Convex mutation resolves on the browser.
 */
export const scheduleElectionLifecycleFn = createServerFn({ method: 'POST' })
  .inputValidator((input: ScheduleInput) => input)
  .handler(async ({ data }) => {
    await scheduleElectionLifecycle({
      electionId: data.electionId,
      slug: data.slug,
      startAt: data.startAt,
      endAt: data.endAt,
    });
    return { ok: true } as const;
  });
