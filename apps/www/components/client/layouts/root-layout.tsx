'use client';

import DashboardNavbar from '@/components/client/components/dashboard-navbar-client';
import HeaderContent from '@/components/client/components/header';
import { api_client } from '@/shared/client/trpc';
import { getBaseUrl } from '@/shared/utils';
import { User } from '@eboto-mo/db/schema';
import { CacheProvider } from '@emotion/react';
import {
  AppShell,
  type ColorScheme,
  ColorSchemeProvider,
  MantineProvider,
  useEmotionCache,
} from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { SessionProvider } from 'next-auth/react';
import { useParams, useServerInsertedHTML } from 'next/navigation';
import { useState } from 'react';
import superjson from 'superjson';

export default function RootLayoutClient({
  children,
  theme,
  user,
}: {
  children: React.ReactNode;
  theme: ColorScheme;
  user: User | null;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            cacheTime: Infinity,
            staleTime: Infinity,
          },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    api_client.createClient({
      links: [
        loggerLink({
          enabled: () => true,
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
      transformer: superjson,
    }),
  );
  const [colorScheme, setColorScheme] = useState<ColorScheme>(theme);

  const cache = useEmotionCache();
  cache.compat = true;
  useServerInsertedHTML(() => (
    <style
      data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(' ')}`}
      dangerouslySetInnerHTML={{
        __html: Object.values(cache.inserted).join(' '),
      }}
    />
  ));
  return (
    <SessionProvider>
      <api_client.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ReactQueryStreamedHydration>
            <CacheProvider value={cache}>
              <ColorSchemeProvider
                colorScheme={colorScheme}
                toggleColorScheme={() => {
                  // toggleTheme();
                  setColorScheme((c) => (c === 'dark' ? 'light' : 'dark'));
                }}
              >
                <MantineProvider
                  withGlobalStyles
                  withNormalizeCSS
                  theme={{
                    fontFamily: 'Poppins, sans-serif',
                    colorScheme,
                    primaryColor: 'green',
                  }}
                >
                  <Notifications />
                  <AppShell
                    padding={0}
                    header={<HeaderContent user={user} />}
                    navbar={<DashboardNavbar />}
                    styles={(theme) => ({
                      main: {
                        backgroundColor:
                          theme.colorScheme === 'dark'
                            ? theme.colors.dark[8]
                            : theme.colors.gray[0],
                      },
                    })}
                  >
                    {children}
                  </AppShell>
                </MantineProvider>
              </ColorSchemeProvider>
            </CacheProvider>
          </ReactQueryStreamedHydration>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </api_client.Provider>
    </SessionProvider>
  );
}
