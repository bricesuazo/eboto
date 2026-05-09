/**
 * Reserved slugs that can't be used for elections (they'd collide with
 * routes like `/sign-in`, `/dashboard`, etc).
 */
export const TAKEN_SLUGS = new Set([
  'sign-in',
  'register',
  'dashboard',
  'account',
  'pricing',
  'contact',
  'terms',
  'privacy',
  'disclaimer',
  'cookie',
  'api',
  'admin',
  'about',
  'help',
  'support',
  'result',
  'vote',
]);

export function isSlugReserved(slug: string) {
  return TAKEN_SLUGS.has(slug.trim().toLowerCase());
}
