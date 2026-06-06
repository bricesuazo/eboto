import type { ConvexQueryClient } from '@convex-dev/react-query';
import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import type { ConvexReactClient } from 'convex/react';
import { Toaster } from 'sonner';

import { DefaultCatchBoundary } from '~/components/default-catch-boundary';
import { NotFound } from '~/components/not-found';
import { SiteHeader } from '~/components/site-header';
import { ThemeProvider } from '~/components/theme-provider';
import { TooltipProvider } from '~/components/ui/tooltip';
import type { AuthServerState } from '~/lib/auth/provider';
import { ConvexAuthProvider } from '~/lib/auth/provider';
import { getServerAuth } from '~/lib/auth/server-fns';
import { AUTH_QUERY_KEY, THEME_BOOTSTRAP } from '~/lib/constants';
import appCss from '~/styles/globals.css?url';

interface RouterContext {
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
}

export interface AuthUser {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
}

export interface RootContext {
  auth: AuthServerState;
  user: AuthUser | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'eBoto | Your One-stop Online Voting Solution' },
      {
        name: 'description',
        content:
          'Empower your elections with eBoto, the versatile and web-based voting platform that offers secure online elections for any type of organization.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon/favicon-16x16.png',
      },
      { rel: 'shortcut icon', href: '/favicon/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/favicon/apple-touch-icon.png' },
      { rel: 'manifest', href: '/favicon/site.webmanifest' },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
  beforeLoad: async ({ context }): Promise<RootContext> => {
    const isServer = typeof window === 'undefined';
    // Cache the server-auth lookup in the queryClient so client-side
    // navigations re-use it instead of round-tripping through the server fn
    // (and a Convex HTTP query) on every page change. The cache is hydrated
    // from the server to the client via `routerWithQueryClient`. The
    // `signIn`/`signOut` actions invalidate it so authentication transitions
    // are picked up on the next navigation.
    const data = await context.queryClient.ensureQueryData({
      queryKey: AUTH_QUERY_KEY,
      queryFn: () => getServerAuth(),
      staleTime: Infinity,
    });
    // During SSR, child loaders run Convex queries via the bridge's
    // `serverHttpClient` (a separate `ConvexHttpClient`), so we need to set
    // the auth token on it here. On the client, the WS auth flow (set by
    // `ConvexAuthProvider` → `ConvexProviderWithAuth`) handles this.
    if (isServer) {
      if (data.token) {
        context.convexQueryClient.serverHttpClient?.setAuth(data.token);
      } else {
        context.convexQueryClient.serverHttpClient?.clearAuth();
      }
    }
    return {
      auth: { token: data.token, timeFetched: data.timeFetched },
      user: (data.user as AuthUser | null) ?? null,
    };
  },
});

function RootComponent() {
  const { auth, convexClient } = Route.useRouteContext();
  return (
    <RootDocument>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <ConvexAuthProvider client={convexClient} serverState={auth}>
            <SiteHeader />
            <Outlet />
            <Toaster richColors position="top-right" />
          </ConvexAuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
