import posthog from 'posthog-js';

import { env } from '~/env';
import { POSTHOG_DEFAULT_HOST } from '~/lib/constants';

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  if (typeof window === 'undefined') return;
  if (!env.VITE_POSTHOG_KEY) return;
  posthog.init(env.VITE_POSTHOG_KEY, {
    api_host: env.VITE_POSTHOG_HOST ?? POSTHOG_DEFAULT_HOST,
    capture_pageview: true,
    capture_pageleave: true,
  });
  initialized = true;
}

interface IdentifyArgs {
  id: string;
  email?: string;
  name?: string;
}

export function identifyPostHogUser({ id, email, name }: IdentifyArgs) {
  if (!initialized) return;
  if (posthog.get_distinct_id() === id) return;
  posthog.identify(id, {
    ...(email ? { email } : {}),
    ...(name ? { name } : {}),
  });
}

export function resetPostHog() {
  if (!initialized) return;
  posthog.reset();
}
