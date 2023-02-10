import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ChakraProvider } from "@chakra-ui/react";

import { api } from "../utils/api";
import Link from "next/link";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <ChakraProvider>
        <header>
          <Link href="/">
            <h1>eBoto Mo</h1>
          </Link>

          <nav>
            <Link href="/signin">Sign in</Link>
            <Link href="/signup">Sign up</Link>
          </nav>
        </header>
        <Component {...pageProps} />
      </ChakraProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
