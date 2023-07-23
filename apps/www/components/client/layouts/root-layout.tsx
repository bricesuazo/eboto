"use client";

import DashboardNavbar from "@/components/client/components/dashboard-navbar-client";
import HeaderContent from "@/components/client/components/header";
import { User } from "@eboto-mo/db/schema";
import { CacheProvider } from "@emotion/react";
import {
  AppShell,
  type ColorScheme,
  ColorSchemeProvider,
  MantineProvider,
  useEmotionCache,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { SessionProvider } from "next-auth/react";
import { useServerInsertedHTML } from "next/navigation";
import { useState } from "react";

export default function RootLayoutClient({
  children,
  theme,
  user,
}: {
  children: React.ReactNode;
  theme: ColorScheme;
  user: User | null;
}) {
  const cache = useEmotionCache();
  cache.compat = true;
  useServerInsertedHTML(() => (
    <style
      data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(" ")}`}
      dangerouslySetInnerHTML={{
        __html: Object.values(cache.inserted).join(" "),
      }}
    />
  ));
  const [colorScheme, setColorScheme] = useState<ColorScheme>(theme);
  return (
    <SessionProvider>
      <CacheProvider value={cache}>
        <ColorSchemeProvider
          colorScheme={colorScheme}
          toggleColorScheme={() => {
            // toggleTheme();
            setColorScheme((c) => (c === "dark" ? "light" : "dark"));
          }}
        >
          <MantineProvider
            withGlobalStyles
            withNormalizeCSS
            theme={{
              fontFamily: "Poppins, sans-serif",
              colorScheme,
              primaryColor: "green",
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
                    theme.colorScheme === "dark"
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
    </SessionProvider>
  );
}
