import { useEffect } from 'react';
import { initSentry } from '~/lib/sentry';
import { initPostHog } from '~/lib/posthog';

/**
 * Mounted once at the root. Boots client-only observability — Sentry +
 * PostHog. Both bail out if their respective env vars aren't set.
 */
export function AnalyticsBootstrap() {
  useEffect(() => {
    initSentry();
    initPostHog();
  }, []);
  return null;
}
