import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import {
  Button,
  ChakraProvider,
  Container,
  Flex,
  Stack,
} from "@chakra-ui/react";

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
          <Container maxW="4xl" alignItems="center" py={4}>
            <Flex justify="space-between">
              <Link href="/">
                <h1>eBoto Mo</h1>
              </Link>

              <Stack direction="row" spacing={4}>
                <Link href="/signin">
                  <Button variant="link">Sign in</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="link">Sign up</Button>
                </Link>
              </Stack>
            </Flex>
          </Container>
        </header>
        <Component {...pageProps} />
      </ChakraProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
