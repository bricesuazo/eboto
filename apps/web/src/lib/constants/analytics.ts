/**
 * Analytics / observability config defaults.
 */

/** Default PostHog ingestion endpoint, used when `VITE_POSTHOG_HOST` isn't set. */
export const POSTHOG_DEFAULT_HOST = 'https://us.i.posthog.com';

/** Fraction of transactions traced by Sentry. */
export const SENTRY_TRACES_SAMPLE_RATE = 0.1;

/** Fraction of normal sessions captured for replay. `0` → only error replays. */
export const SENTRY_REPLAYS_SESSION_SAMPLE_RATE = 0;

/** Fraction of error sessions captured for replay. */
export const SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE = 0.1;
