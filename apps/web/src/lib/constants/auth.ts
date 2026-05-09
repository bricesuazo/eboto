/**
 * Constants for the cookie-based Convex Auth flow (proxy + httpOnly cookies).
 */

/** Query key for the cached server-auth lookup, shared between the root
 *  beforeLoad (writer) and sign-out (invalidator). */
export const AUTH_QUERY_KEY = ['__serverAuth'] as const;

/** API route that fronts Convex Auth (POST proxy + OAuth/magic-link callback). */
export const AUTH_API_ROUTE = '/api/auth';

/** Search param appended by `signIn` so the OAuth callback knows where to
 *  redirect after the GET handler exchanges the code. */
export const AUTH_REDIRECT_PARAM = '_to';

/** Placeholder we return to the browser instead of the real refresh token —
 *  the real one stays in the httpOnly cookie. The proxy substitutes the cookie
 *  value when it sees this sentinel on a refresh request. */
export const AUTH_REFRESH_SENTINEL = 'dummy';

/** Refresh the JWT if it has less than this much lifetime remaining. */
export const AUTH_TOKEN_REFRESH_BUFFER_MS = 60_000;

/** Lower bound on the refresh buffer for very short-lived tokens. */
export const AUTH_TOKEN_REFRESH_MIN_BUFFER_MS = 10_000;

/** Base name of the combined JWT + refresh-token cookie (gets `__Host-`
 *  prefix outside localhost). */
export const AUTH_COOKIE_NAME = '__convexAuth';

/** Base name of the OAuth verifier cookie (gets `__Host-` prefix outside
 *  localhost). */
export const AUTH_VERIFIER_COOKIE_NAME = '__convexAuthOAuthVerifier';

/** Cookie-name prefix required by browsers for `__Host-` cookies (Path=/,
 *  Secure, no Domain). Skipped on localhost since `Secure` is incompatible
 *  with plain HTTP there. */
export const AUTH_HOST_COOKIE_PREFIX = '__Host-';
