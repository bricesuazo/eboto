import Link from "next/link";
import { Button, Container, Flex, Stack, useColorMode } from "@chakra-ui/react";

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <header>
      <Container maxW="4xl" alignItems="center" py={4}>
        <Flex justify="space-between">
          <Link href="/">
            <h1>eBoto Mo</h1>
          </Link>

          <Stack direction="row" spacing={4}>
            <Button size="xs" onClick={toggleColorMode}>
              Toggle {colorMode === "light" ? "Dark" : "Light"}
            </Button>
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
  );
};

export default Header;
