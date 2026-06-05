import { ConvexHttpClient } from 'convex/browser';

import { api } from '@eboto/backend/api';

import { env } from '~/env';
import {
  AUTH_TOKEN_REFRESH_BUFFER_MS,
  AUTH_TOKEN_REFRESH_MIN_BUFFER_MS,
} from '~/lib/constants';
import { fetchAction } from './convex';
import type { CookieConfig } from './cookies';
import { getAuthCookies, setAuthTokens } from './cookies';

interface DecodedToken {
  exp: number;
  iat: number;
}

function decodeJwt(token: string): DecodedToken | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const padded = payload.padEnd(
      payload.length + ((4 - (payload.length % 4)) % 4),
      '=',
    );
    const json =
      typeof atob === 'function'
        ? atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
        : Buffer.from(
            padded.replace(/-/g, '+').replace(/_/g, '/'),
            'base64',
          ).toString('utf-8');
    const decoded = JSON.parse(json) as Partial<DecodedToken>;
    if (typeof decoded.exp !== 'number' || typeof decoded.iat !== 'number')
      return null;
    return decoded as DecodedToken;
  } catch {
    return null;
  }
}

interface AuthOptions {
  cookieConfig?: CookieConfig;
}

export async function getValidAuthToken(
  options: AuthOptions = {},
): Promise<string | null> {
  const config = options.cookieConfig ?? { maxAge: null };
  const { token, refreshToken } = getAuthCookies();
  if (!token && !refreshToken) return null;
  if (!token || !refreshToken) {
    setAuthTokens(null, config);
    return null;
  }

  const decoded = decodeJwt(token);
  if (!decoded) {
    setAuthTokens(null, config);
    return null;
  }

  const lifetimeMs = (decoded.exp - decoded.iat) * 1000;
  const minExp =
    Date.now() +
    Math.min(
      AUTH_TOKEN_REFRESH_BUFFER_MS,
      Math.max(AUTH_TOKEN_REFRESH_MIN_BUFFER_MS, lifetimeMs / 10),
    );
  if (decoded.exp * 1000 > minExp) return token;

  try {
    const result = (await fetchAction('auth:signIn', { refreshToken })) as {
      tokens?: { token: string; refreshToken: string } | null;
    };
    if (!result.tokens) {
      setAuthTokens(null, config);
      return null;
    }
    setAuthTokens(result.tokens, config);
    return result.tokens.token;
  } catch (err) {
    console.error('[auth] refresh failed', err);
    setAuthTokens(null, config);
    return null;
  }
}

export async function fetchCurrentUserWithToken(token: string) {
  const client = new ConvexHttpClient(env.VITE_CONVEX_URL);
  client.setAuth(token);
  try {
    return await client.query(api.users.current, {});
  } catch (err) {
    console.error('[auth] fetchCurrentUser failed', err);
    return null;
  }
}

export async function exchangeCode(code: string) {
  const { verifier } = getAuthCookies();
  try {
    const result = (await fetchAction('auth:signIn', {
      params: { code },
      verifier: verifier ?? undefined,
    })) as { tokens?: { token: string; refreshToken: string } | null };
    if (result.tokens === undefined) {
      throw new Error('Invalid signIn result for code exchange');
    }
    setAuthTokens(result.tokens ?? null);
    return result.tokens !== null;
  } catch (err) {
    console.error('[auth] code exchange failed', err);
    setAuthTokens(null);
    return false;
  }
}

/**
 * Exchanges an OAuth/magic-link code for tokens and returns the resulting
 * tokens (or null on failure). Does NOT touch global setCookie state — caller
 * is responsible for serializing the result into Set-Cookie response headers.
 *
 * Magic-link codes are stored with no verifier, so the caller passes
 * `skipVerifier` for those — sending a stale OAuth verifier cookie would fail
 * Convex's strict `verificationCode.verifier !== verifier` check.
 */
export async function exchangeCodeForTokens(
  code: string,
  options: { skipVerifier?: boolean } = {},
): Promise<{ token: string; refreshToken: string } | null> {
  const verifier = options.skipVerifier
    ? undefined
    : (getAuthCookies().verifier ?? undefined);
  try {
    const result = (await fetchAction('auth:signIn', {
      params: { code },
      verifier,
    })) as { tokens?: { token: string; refreshToken: string } | null };
    return result.tokens ?? null;
  } catch (err) {
    console.error('[auth] code exchange failed', err);
    return null;
  }
}
