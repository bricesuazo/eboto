import {
  ColorSchemeProvider,
  MantineProvider,
  type ColorScheme,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import type { AppContext, AppProps, AppType } from "next/app";
import Head from "next/head";
import { useState } from "react";
import Header from "../components/Header";
import { ConfettiProvider } from "../lib/confetti";
import { api } from "../utils/api";
import { Poppins } from "next/font/google";
import { getCookie, setCookie } from "cookies-next";
import { useHotkeys } from "@mantine/hooks";

interface Props extends AppProps {
  pageProps: {
    session: Session | null;
    colorScheme: ColorScheme;
  };
}
const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const App: AppType<Props> = api.withTRPC(function App({
  Component,
  pageProps: { session, ...props },
}: Props) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(
    props.colorScheme
  );

  const toggleColorScheme = (value?: ColorScheme) => {
    const nextColorScheme =
      value || (colorScheme === "dark" ? "light" : "dark");
    setColorScheme(nextColorScheme);
    setCookie("theme", nextColorScheme, {
      maxAge: 60 * 60 * 24 * 30,
    });
  };

  useHotkeys([["alt+d", () => toggleColorScheme()]]);

  return (
    <>
      <Head>
        <title>eBoto Mo</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, w=device-width"
        />
        <link
          rel="shortcut icon"
          href="/images/favicon.ico"
          type="image/x-icon"
        />
      </Head>

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
            }}
          >
            <Notifications />
            <ConfettiProvider>
              <Header />

              <Component {...props} />
            </ConfettiProvider>
          </MantineProvider>
        </ColorSchemeProvider>
      </SessionProvider>
    </>
  );
}) as AppType<Props>;

export default App;

App.getInitialProps = (appContext: AppContext) => {
  return {
    pageProps: { colorScheme: getCookie("theme", appContext.ctx) || "light" },
  } as AppProps;
};
