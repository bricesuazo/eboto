/**
 * Returns `raw` only if it's a same-origin internal path. Anything else
 * (full URL, protocol-relative `//evil.com`, scheme-relative `javascript:`,
 * backslash tricks, non-strings) is rejected so a crafted `?to=` can't
 * bounce a freshly-signed-in user off-site.
 *
 * Returns `null` when invalid — callers supply their own fallback
 * (e.g. `safeInternalPath(...) ?? '/dashboard'`).
 */
export function safeInternalPath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  // Must start with a single slash and not double-slash (which is
  // protocol-relative). Reject anything containing scheme markers or
  // backslashes (which some browsers normalize to `/`).
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  if (raw.includes(':') || raw.includes('\\')) return null;
  return raw;
}
