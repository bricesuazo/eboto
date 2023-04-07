import {
  ColorSchemeProvider,
  MantineProvider,
  type ColorScheme,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import type { AppProps, AppType } from "next/app";
import Head from "next/head";
import { ConfettiProvider } from "../lib/confetti";
import { api } from "../utils/api";
import { Poppins } from "next/font/google";
import {
  useDocumentVisibility,
  useFavicon,
  useHotkeys,
  useLocalStorage,
} from "@mantine/hooks";
import AppShellComponent from "../components/AppShell";
import { RouterTransition } from "../components/RouterTransition";
import { Analytics } from "@vercel/analytics/react";

interface Props extends AppProps {
  pageProps: {
    session: Session | null;
  };
}
const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const App: AppType<Props> = api.withTRPC(function App({
  Component,
  pageProps: { session, ...props },
}: Props) {
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "theme",
    defaultValue: "light",
    getInitialValueInEffect: true,
  });

  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

  useHotkeys([["mod+J", () => toggleColorScheme()]]);

  useFavicon(
    useDocumentVisibility() === "visible"
      ? "/images/logo-4/favicon.ico"
      : "/images/logo-2/favicon.ico"
  );

  return (
    <>
      <Head>
        <title>eBoto Mo &ndash; Your One-Stop Online Voting Solution</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width user-scalable=no"
        />
      </Head>

      <ConfettiProvider>
        <SessionProvider session={session}>
          <ColorSchemeProvider
            colorScheme={colorScheme}
            toggleColorScheme={toggleColorScheme}
          >
            <MantineProvider
              withGlobalStyles
              withNormalizeCSS
              theme={{
                colorScheme,
                fontFamily: poppins.style.fontFamily,
                primaryColor: "green",
              }}
            >
              <Notifications />
              <AppShellComponent>
                <RouterTransition />
                <Component {...props} />
                <Analytics />
              </AppShellComponent>
            </MantineProvider>
          </ColorSchemeProvider>
        </SessionProvider>
      </ConfettiProvider>
    </>
  );
}) as AppType<Props>;

export default App;
