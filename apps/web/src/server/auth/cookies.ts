import {
  deleteCookie,
  getCookie,
  getRequestHeaders,
  setCookie,
} from '@tanstack/react-start/server';

import {
  AUTH_COOKIE_NAME,
  AUTH_HOST_COOKIE_PREFIX,
  AUTH_VERIFIER_COOKIE_NAME,
} from '~/lib/constants';

export interface CookieConfig {
  maxAge: number | null;
}

const DEFAULT_CONFIG: CookieConfig = { maxAge: null };

function isLocalhost(host: string | undefined): boolean {
  if (!host) return false;
  const hostname = host.split(':')[0]?.toLowerCase();
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '[::1]'
  );
}

function names() {
  const headers = getRequestHeaders();
  const host = headers.get('host') ?? headers.get('x-forwarded-host') ?? '';
  const local = isLocalhost(host);

  const prefix = local ? '' : AUTH_HOST_COOKIE_PREFIX;
  return {
    auth: `${prefix}${AUTH_COOKIE_NAME}`,
    verifier: `${prefix}${AUTH_VERIFIER_COOKIE_NAME}`,
    local,
  };
}

function options(local: boolean, config: CookieConfig) {
  return {
    secure: !local,
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    ...(config.maxAge !== null ? { maxAge: config.maxAge } : {}),
  };
}

interface AuthTokens {
  token: string;
  refreshToken: string;
}

function encodeAuth(tokens: AuthTokens): string {
  return Buffer.from(JSON.stringify(tokens), 'utf-8').toString('base64url');
}

function decodeAuth(value: string): AuthTokens | null {
  try {
    const json = Buffer.from(value, 'base64url').toString('utf-8');
    const parsed: unknown = JSON.parse(json);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as AuthTokens).token === 'string' &&
      typeof (parsed as AuthTokens).refreshToken === 'string'
    ) {
      return parsed as AuthTokens;
    }
  } catch {}
  return null;
}

export function getAuthCookies() {
  const n = names();
  const auth = getCookie(n.auth) ?? null;
  const decoded = auth ? decodeAuth(auth) : null;
  return {
    token: decoded?.token ?? null,
    refreshToken: decoded?.refreshToken ?? null,
    verifier: getCookie(n.verifier) ?? null,
  };
}

export function setAuthTokens(
  tokens: AuthTokens | null,
  config: CookieConfig = DEFAULT_CONFIG,
) {
  const n = names();
  const opts = options(n.local, config);
  if (tokens === null) {
    deleteCookie(n.auth, { ...opts, maxAge: undefined });
  } else {
    setCookie(n.auth, encodeAuth(tokens), opts);
  }
}

export function setAuthVerifier(
  verifier: string | null,
  config: CookieConfig = DEFAULT_CONFIG,
) {
  const n = names();
  const opts = options(n.local, config);
  if (verifier === null) {
    deleteCookie(n.verifier, { ...opts, maxAge: undefined });
  } else {
    setCookie(n.verifier, verifier, opts);
  }
}
