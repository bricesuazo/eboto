/**
 * Open Graph / social card constants.
 */

/** Standard OG image width (Twitter/Facebook recommendation). */
export const OG_IMAGE_WIDTH = 1200;

/** Standard OG image height (1.91:1 ratio with width). */
export const OG_IMAGE_HEIGHT = 630;

/** Fallback display name used in OG images when no `election_name` is provided. */
export const OG_FALLBACK_TITLE = 'eBoto';

/**
 * Absolute base URL used when assembling crawler-facing image URLs (Twitter,
 * Facebook, LinkedIn need fully-qualified URLs in `og:image`). In production
 * we point at the deployed origin; in dev we use localhost so the image still
 * renders when sharing a tunnel.
 */
export const SITE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://eboto.app'
    : 'http://localhost:3000';

/**
 * `Cache-Control` headers for the `/api/og` route. Social crawlers re-fetch
 * frequently, so we serve a 1-day CDN cache with a week of stale-while-
 * revalidate to keep edge function invocations down.
 */
export const OG_CACHE_HEADERS = {
  'Cache-Control':
    'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
} as const;

/** Truncation lengths for query-param strings rendered into OG cards. */
export const OG_MAX_NAME_LEN = 80;
export const OG_MAX_DATE_LEN = 60;
export const OG_MAX_POSITION_LEN = 80;

/** Palette used by the OG card layouts. */
export const OG_COLORS = {
  primary: '#16a34a',
  foreground: '#0a0a0a',
  muted: '#525252',
  surface: '#f3f4f6',
} as const;
