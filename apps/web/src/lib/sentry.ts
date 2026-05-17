import * as Sentry from '@sentry/react';

import { env } from '~/env';
import {
  SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
  SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
  SENTRY_TRACES_SAMPLE_RATE,
} from '~/lib/constants';

let initialized = false;

export function initSentry() {
  if (initialized) return;
  if (!env.VITE_SENTRY_DSN) return;
  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    replaysSessionSampleRate: SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
    replaysOnErrorSampleRate: SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
    environment: env.MODE,
  });
  initialized = true;
}
