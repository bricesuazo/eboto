/**
 * Convex error code strings thrown by the backend (see
 * `packages/backend/convex/_helpers/auth.ts`). Exposed as constants so the
 * client never spells them as bare string literals at call sites.
 */

export const CONVEX_ERROR_UNAUTHORIZED = 'unauthorized';
export const CONVEX_ERROR_FORBIDDEN = 'forbidden';
export const CONVEX_ERROR_NOT_FOUND = 'not_found';
export const CONVEX_ERROR_VOTING_CLOSED = 'voting_closed';
export const CONVEX_ERROR_REQUIRES_AUTH = 'requires_auth';
