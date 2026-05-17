import { createFileRoute } from '@tanstack/react-router';

import { AUTH_REDIRECT_PARAM } from '~/lib/constants';
import { exchangeCodeForTokens } from '~/server/auth';
import { setAuthTokens } from '~/server/auth/cookies';
import { proxyAuthAction } from '~/server/auth/proxy';

function safeRedirectTarget(raw: string | null, origin: string): URL {
  const fallback = new URL('/', origin);
  if (!raw) return fallback;
  try {
    if (raw.startsWith('/')) return new URL(raw, origin);
    const parsed = new URL(raw);
    if (parsed.origin === origin) return parsed;
    return fallback;
  } catch {
    return fallback;
  }
}

export const Route = createFileRoute('/api/auth')({
  server: {
    handlers: {
      POST: ({ request }) => proxyAuthAction(request),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const target = safeRedirectTarget(
          url.searchParams.get(AUTH_REDIRECT_PARAM),
          url.origin,
        );

        if (!code) {
          return new Response(null, {
            status: 303,
            headers: { Location: target.toString() },
          });
        }

        const tokens = await exchangeCodeForTokens(code);
        if (!tokens) {
          const signInUrl = new URL('/sign-in', url.origin);
          signInUrl.searchParams.set('error', 'invalid-link');
          const rawTo = url.searchParams.get(AUTH_REDIRECT_PARAM);
          if (rawTo?.startsWith('/')) {
            signInUrl.searchParams.set('to', rawTo);
          }
          return new Response(null, {
            status: 303,
            headers: { Location: signInUrl.toString() },
          });
        }
        setAuthTokens(tokens);
        return new Response(null, {
          status: 303,
          headers: { Location: target.toString() },
        });
      },
    },
  },
});
