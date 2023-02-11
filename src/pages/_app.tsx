import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ChakraProvider } from "@chakra-ui/react";
import { Analytics } from "@vercel/analytics/react";

import { api } from "../utils/api";
import Header from "../components/Header";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <ChakraProvider>
        <Header />
        <Component {...pageProps} />
        <Analytics />
      </ChakraProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
