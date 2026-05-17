import { useEffect } from 'react';
import { useRouteContext } from '@tanstack/react-router';

import {
  identifyPostHogUser,
  initPostHog,
  resetPostHog,
} from '~/lib/posthog';
import { initSentry } from '~/lib/sentry';

/**
 * Mounted once at the root. Boots client-only observability — Sentry +
 * PostHog. Both bail out if their respective env vars aren't set. Also
 * mirrors the current auth identity into PostHog (identify on sign-in,
 * reset on sign-out) so events are attributed to the right user.
 */
export function AnalyticsBootstrap() {
  const { user } = useRouteContext({ from: '__root__' });

  useEffect(() => {
    initSentry();
    initPostHog();
  }, []);

  useEffect(() => {
    if (user) {
      identifyPostHogUser({
        id: user._id,
        email: user.email,
        name: user.name,
      });
    } else {
      resetPostHog();
    }
  }, [user]);

  return null;
}
