import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ChakraProvider } from "@chakra-ui/react";
import { Analytics } from "@vercel/analytics/react";
import { api } from "../utils/api";
import Header from "../components/Header";
import Head from "next/head";
import { ConfettiProvider } from "../lib/confetti";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <>
      <Head>
        <title>eBoto Mo</title>
        {/* add favicon */}
        <link
          rel="shortcut icon"
          href="/images/favicon.ico"
          type="image/x-icon"
        />
      </Head>
      <SessionProvider session={session}>
        <ChakraProvider>
          <ConfettiProvider>
            <Header />

            <Component {...pageProps} />
            <Analytics />
          </ConfettiProvider>
        </ChakraProvider>
      </SessionProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
