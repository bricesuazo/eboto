import { createServerFn } from '@tanstack/react-start';

import type { Id } from '@eboto/backend/data-model';

import { scheduleElectionLifecycle } from '~/server/inngest';

interface ScheduleInput {
  electionId: Id<'elections'>;
  slug: string;
  /** Absolute unix-ms — must already include voting-hour-of-day. */
  startAt: number;
  endAt: number;
  /** IANA timezone the dates/hours are interpreted in. */
  timezone: string;
}

/**
 * Server fn called by election create/update flows to send the lifecycle
 * event to Inngest. Lives client-callable so we can fire it after the
 * Convex mutation resolves on the browser.
 */
export const scheduleElectionLifecycleFn = createServerFn({ method: 'POST' })
  .inputValidator((input: ScheduleInput) => input)
  .handler(async ({ data }) => {
    try {
      await scheduleElectionLifecycle({
        electionId: data.electionId,
        slug: data.slug,
        startAt: data.startAt,
        endAt: data.endAt,
        timezone: data.timezone,
      });
      return { ok: true as const };
    } catch (err) {
      // Don't throw: scheduling is non-blocking and must not fail the save.
      // Return the reason so the browser can surface it (otherwise a misconfig
      // like a missing INNGEST_ENV is invisible — it only logs server-side).
      console.error('[inngest] failed to schedule election lifecycle', err);
      return {
        ok: false as const,
        error:
          err instanceof Error
            ? err.message
            : 'Failed to schedule election lifecycle',
      };
    }
  });
