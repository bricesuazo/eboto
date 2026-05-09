import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithAuth } from 'convex/react';

import {
  AUTH_API_ROUTE,
  AUTH_REDIRECT_PARAM,
  AUTH_REFRESH_SENTINEL,
} from '~/lib/constants';

interface SignInArgs {
  provider?: string;
  params?: Record<string, unknown> & { redirectTo?: string; code?: string };
  refreshToken?: string;
}

interface SignInResponse {
  redirect?: string;
  tokens?: { token: string; refreshToken: string } | null;
  started?: boolean;
}

export interface AuthActions {
  signIn: (
    provider: string,
    params?: SignInArgs['params'],
  ) => Promise<{ signingIn: boolean; redirect?: URL }>;
  signOut: () => Promise<void>;
}

export interface AuthServerState {
  token: string | null;
  timeFetched: number;
}

const AuthActionsContext = createContext<AuthActions | null>(null);
const AuthTokenContext = createContext<string | null>(null);

interface InternalAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchAccessToken: (args: {
    forceRefreshToken: boolean;
  }) => Promise<string | null>;
}

const InternalAuthContext = createContext<InternalAuthState>({
  isLoading: true,
  isAuthenticated: false,
  fetchAccessToken: async () => null,
});

async function callAuthApi(
  action: 'auth:signIn' | 'auth:signOut',
  args: SignInArgs,
): Promise<SignInResponse | null> {
  const response = await fetch(AUTH_API_ROUTE, {
    method: 'POST',
    body: JSON.stringify({ action, args }),
    headers: { 'content-type': 'application/json' },
  });
  if (response.status >= 400) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error ?? 'Auth request failed');
  }
  if (response.status === 204) return null;
  return (await response.json()) as SignInResponse | null;
}

export function ConvexAuthProvider({
  client,
  serverState,
  children,
}: {
  client: ConvexReactClient;
  serverState: AuthServerState;
  children: ReactNode;
}) {
  const tokenRef = useRef<string | null>(serverState.token);
  const [token, setToken] = useState<string | null>(serverState.token);
  const lastFetched = useRef(serverState.timeFetched);

  const setNewToken = useCallback((next: string | null) => {
    tokenRef.current = next;
    setToken(next);
  }, []);

  useEffect(() => {
    if (serverState.timeFetched <= lastFetched.current) return;
    lastFetched.current = serverState.timeFetched;
    setNewToken(serverState.token);
  }, [serverState.timeFetched, serverState.token, setNewToken]);

  const refresh = useCallback(async (): Promise<string | null> => {
    try {
      const result = await callAuthApi('auth:signIn', {
        refreshToken: AUTH_REFRESH_SENTINEL,
      });
      const newToken = result?.tokens?.token ?? null;
      setNewToken(newToken);
      return newToken;
    } catch (err) {
      console.error('[auth] refresh failed', err);
      setNewToken(null);
      return null;
    }
  }, [setNewToken]);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!forceRefreshToken) return tokenRef.current;
      return refresh();
    },
    [refresh],
  );

  const signIn = useCallback<AuthActions['signIn']>(
    async (provider, params) => {
      const wrappedParams = { ...params };
      const finalRedirect = params?.redirectTo ?? '/';
      wrappedParams.redirectTo = `${AUTH_API_ROUTE}?${AUTH_REDIRECT_PARAM}=${encodeURIComponent(finalRedirect)}`;
      const result = await callAuthApi('auth:signIn', {
        provider,
        params: wrappedParams,
      });
      if (result?.redirect) {
        return { signingIn: false, redirect: new URL(result.redirect) };
      }
      if (result?.tokens !== undefined) {
        const newToken = result.tokens?.token ?? null;
        setNewToken(newToken);
        return { signingIn: newToken !== null };
      }
      return { signingIn: !!result?.started };
    },
    [setNewToken],
  );

  const signOut = useCallback<AuthActions['signOut']>(async () => {
    try {
      await callAuthApi('auth:signOut', {});
    } finally {
      setNewToken(null);
    }
  }, [setNewToken]);

  const handledCode = useRef(false);
  useEffect(() => {
    if (handledCode.current) return;
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (!code) return;
    handledCode.current = true;
    url.searchParams.delete('code');
    void (async () => {
      await callAuthApi('auth:signIn', { params: { code } })
        .then((result) => {
          const newToken = result?.tokens?.token ?? null;
          setNewToken(newToken);
        })
        .catch((err) => {
          console.error('[auth] code exchange failed', err);
        });
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    })();
  }, [setNewToken]);

  const actions = useMemo<AuthActions>(
    () => ({ signIn, signOut }),
    [signIn, signOut],
  );

  const internalAuth = useMemo<InternalAuthState>(
    () => ({
      isLoading: false,
      isAuthenticated: token !== null,
      fetchAccessToken,
    }),
    [fetchAccessToken, token],
  );

  return (
    <InternalAuthContext.Provider value={internalAuth}>
      <AuthActionsContext.Provider value={actions}>
        <AuthTokenContext.Provider value={token}>
          <ConvexProviderWithAuth client={client} useAuth={useInternalAuth}>
            {children}
          </ConvexProviderWithAuth>
        </AuthTokenContext.Provider>
      </AuthActionsContext.Provider>
    </InternalAuthContext.Provider>
  );
}

function useInternalAuth() {
  return useContext(InternalAuthContext);
}

export function useAuthActions(): AuthActions {
  const ctx = useContext(AuthActionsContext);
  if (!ctx) {
    throw new Error('useAuthActions must be used within ConvexAuthProvider');
  }
  return ctx;
}

export function useAuthToken(): string | null {
  return useContext(AuthTokenContext);
}
