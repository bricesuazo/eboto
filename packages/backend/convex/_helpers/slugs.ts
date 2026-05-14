/**
 * Combining diacritics block (U+0300-U+036F). NFKD decomposes accented
 * characters into base + diacritic; we then strip the diacritics so e.g.
 * "José" → "Jose" before lowercasing.
 */
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/**
 * Lowercases, ASCII-folds, and dash-joins a free-form title. Used to derive
 * election/candidate slugs from human input at create time so the user
 * doesn't have to think about URL safety.
 *
 *   "  José Rizal Jr.  " → "jose-rizal-jr"
 *   "Class of '25 — Pres" → "class-of-25-pres"
 *
 * Empty inputs return "" so callers can detect the fail case (and either
 * reject or fall back to a placeholder like a random suffix).
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Reserved slugs that can't be used for elections (they'd collide with
 * routes like `/sign-in`, `/dashboard`, etc).
 */
export const TAKEN_SLUGS = new Set([
  'sign-in',
  'sign-out',
  'sign-up',
  'signin',
  'signout',
  'signup',
  'login',
  'logout',
  'register',
  'auth',
  'dashboard',
  'account',
  'profile',
  'settings',
  'new',
  'edit',
  'create',
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
