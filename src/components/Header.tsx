import Link from "next/link";
import {
  Box,
  Button,
  Container,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { signOut, useSession } from "next-auth/react";
import {
  BsFillBarChartFill,
  BsFillMoonFill,
  BsFillSunFill,
} from "react-icons/bs";
import { GoSignOut } from "react-icons/go";
import Image from "next/image";

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { status, data } = useSession();

  return (
    <header>
      <Container maxW="4xl" alignItems="center" py={4}>
        <Flex justify="space-between">
          <Link href="/">
            <Stack direction="row" alignItems="center">
              <Image
                src="/images/eboto-mo-logo.png"
                alt="eBoto Mo Logo"
                width={32}
                height={32}
              />
              <Text fontWeight="medium">eBoto Mo</Text>
            </Stack>
          </Link>
          {status === "unauthenticated" && (
            <Stack direction="row" alignItems="center" spacing={4}>
              <Link href="/signin">
                <Button variant="link">Sign in</Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline">Get Started</Button>
              </Link>
            </Stack>
          )}
          {status === "authenticated" && (
            <Menu placement="bottom-end">
              <MenuButton
                bg="gray.100"
                _hover={{
                  bg: "gray.200",
                }}
                borderRadius="50%"
                p={1}
              >
                <Image
                  src={
                    data?.user.image ? data.user.image : "/default-avatar.png"
                  }
                  alt="Profile picture"
                  width={32}
                  height={32}
                  style={{ borderRadius: "50%" }}
                />
              </MenuButton>
              <MenuList>
                <MenuItem icon={<BsFillBarChartFill />}>
                  <Link href="/dashboard">Dashboard</Link>
                </MenuItem>
                <MenuItem
                  icon={
                    colorMode === "light" ? (
                      <BsFillMoonFill />
                    ) : (
                      <BsFillSunFill />
                    )
                  }
                  onClick={toggleColorMode}
                  closeOnSelect={false}
                >
                  Theme
                </MenuItem>
                <MenuItem
                  onClick={() =>
                    signOut({
                      callbackUrl: "/signin",
                    })
                  }
                  icon={<GoSignOut />}
                >
                  Log out
                </MenuItem>
              </MenuList>
            </Menu>
          )}
        </Flex>
      </Container>
    </header>
  );
};

export default Header;
