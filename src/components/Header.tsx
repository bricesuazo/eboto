import Link from "next/link";
import { Button, Container, Flex, Stack, useColorMode } from "@chakra-ui/react";
import { signOut, useSession } from "next-auth/react";

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const session = useSession();
  console.log("🚀 ~ file: Header.tsx:8 ~ Header ~ session", session);
  return (
    <header>
      <Container maxW="4xl" alignItems="center" py={4}>
        <Flex justify="space-between">
          <Link href="/">
            <Button variant="link">eBoto Mo</Button>
          </Link>

          <Stack direction="row" spacing={4} alignItems="center">
            <Button size="xs" onClick={toggleColorMode}>
              Toggle {colorMode === "light" ? "Dark" : "Light"}
            </Button>
            {session.status === "authenticated" ? (
              <>
                <Button
                  onClick={async () => {
                    await signOut();
                  }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="link">Sign in</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="link">Sign up</Button>
                </Link>
              </>
            )}
          </Stack>
        </Flex>
      </Container>
    </header>
  );
};

export default Header;
