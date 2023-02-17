import Link from "next/link";
import {
  Button,
  Container,
  Flex,
  IconButton,
  Stack,
  useColorMode,
} from "@chakra-ui/react";
import { signOut, useSession } from "next-auth/react";
import { BsFillMoonFill, BsFillSunFill } from "react-icons/bs";

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { status } = useSession();

  return (
    <header>
      <Container maxW="4xl" alignItems="center" py={4}>
        <Flex justify="space-between">
          <Link href="/">
            <Button variant="link">eBoto Mo</Button>
          </Link>

          <Stack direction="row" spacing={4} alignItems="center">
            <IconButton
              size="sm"
              variant="outline"
              onClick={toggleColorMode}
              aria-label="Toggle theme"
              icon={
                colorMode === "light" ? <BsFillMoonFill /> : <BsFillSunFill />
              }
            />
            {status === "loading" && (
              <Button size="sm" isLoading>
                Loading
              </Button>
            )}
            {status === "authenticated" && (
              <Button
                onClick={async () => {
                  await signOut({
                    callbackUrl: "/signin",
                  });
                }}
                size="sm"
              >
                Sign out
              </Button>
            )}
            {status === "unauthenticated" && (
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
