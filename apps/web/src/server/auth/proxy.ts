import { AUTH_MAGIC_LINK_PARAM, AUTH_REFRESH_SENTINEL } from '~/lib/constants';
import { fetchAction } from './convex';
import type { CookieConfig } from './cookies';
import { getAuthCookies, setAuthTokens, setAuthVerifier } from './cookies';

interface SignInResult {
  redirect?: string;
  verifier?: string;
  tokens?: { token: string; refreshToken: string } | null;
  started?: boolean;
}

const DEFAULT_CONFIG: CookieConfig = { maxAge: null };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status,
  });
}

function isCorsRequest(request: Request) {
  const origin = request.headers.get('origin');
  const url = origin ? new URL(origin) : null;
  if (!url) return false;
  const reqUrl = new URL(request.url);
  return (
    url.host !== request.headers.get('host') || url.protocol !== reqUrl.protocol
  );
}

export async function proxyAuthAction(
  request: Request,
  config: CookieConfig = DEFAULT_CONFIG,
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Invalid method', { status: 405 });
  }
  if (isCorsRequest(request)) {
    return new Response('Invalid origin', { status: 403 });
  }

  let payload: { action?: string; args?: Record<string, unknown> };
  try {
    payload = await request.json();
  } catch {
    return new Response('Invalid body', { status: 400 });
  }
  const action = payload.action;
  const args = payload.args ?? {};
  if (action !== 'auth:signIn' && action !== 'auth:signOut') {
    return new Response('Invalid action', { status: 400 });
  }

  let token: string | undefined;
  if (action === 'auth:signIn' && 'refreshToken' in args) {
    const cookies = getAuthCookies();
    if (cookies.refreshToken === null) {
      return jsonResponse({ tokens: null });
    }
    args.refreshToken = cookies.refreshToken;
  } else {
    token = getAuthCookies().token ?? undefined;
  }

  if (action === 'auth:signIn') {
    let result: SignInResult;
    const params = (args.params as Record<string, unknown> | undefined) ?? {};
    const skipAuthForRequest =
      'refreshToken' in args || params.code !== undefined;

    // Magic-link start: tag the `redirectTo` so the GET handler that later
    // exchanges the emailed code knows to skip the OAuth verifier cookie.
    // `params.email` is only present for email/phone sign-ins, never OAuth.
    if (
      params.code === undefined &&
      typeof params.email === 'string' &&
      typeof params.redirectTo === 'string'
    ) {
      const separator = params.redirectTo.includes('?') ? '&' : '?';
      params.redirectTo = `${params.redirectTo}${separator}${AUTH_MAGIC_LINK_PARAM}=1`;
    }
    try {
      result = (await fetchAction(
        action,
        args,
        skipAuthForRequest ? {} : { token },
      )) as SignInResult;
    } catch (err) {
      console.error('[auth] signIn error', err);
      setAuthTokens(null, config);
      const message = err instanceof Error ? err.message : 'Sign in failed';
      return jsonResponse({ error: message }, 400);
    }

    if (result.redirect !== undefined) {
      setAuthVerifier(result.verifier ?? null, config);
      return jsonResponse({ redirect: result.redirect });
    }
    if (result.tokens !== undefined) {
      setAuthTokens(result.tokens ?? null, config);
      return jsonResponse({
        tokens: result.tokens
          ? { token: result.tokens.token, refreshToken: AUTH_REFRESH_SENTINEL }
          : null,
      });
    }
    // Email/phone signin start (result.started). Clear any stale OAuth
    // verifier cookie — the magic-link GET handler would otherwise pass it
    // to Convex, which fails the strict `verificationCode.verifier !==
    // verifier` check (email codes are stored with no verifier).
    setAuthVerifier(null, config);
    return jsonResponse(result);
  }

  // auth:signOut
  try {
    await fetchAction(action, args, { token });
  } catch (err) {
    console.error('[auth] signOut error', err);
  }
  setAuthTokens(null, config);
  return jsonResponse(null);
}
