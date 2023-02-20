import Link from "next/link";
import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
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
  BsChevronDown,
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
      <Container maxW="4xl" py={4}>
        <Flex justify="space-between" alignItems="center">
          <Link href="/">
            <Stack
              direction="row"
              alignItems="center"
              _hover={{
                opacity: 0.75,
              }}
              transition="all 0.2s"
            >
              <Image
                src="/images/eboto-mo-logo.png"
                alt="eBoto Mo Logo"
                width={32}
                height={32}
              />
              <Text fontWeight="medium" display={["none", "inherit"]}>
                eBoto Mo
              </Text>
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
              {({ isOpen }) => {
                return (
                  <>
                    <MenuButton
                      bg="gray.50"
                      _hover={{
                        bg: "gray.100",
                      }}
                      transition="all 0.2s"
                      _dark={{
                        bg: "gray.800",
                        _hover: {
                          bg: "gray.700",
                        },
                      }}
                      px={2}
                      py={1}
                      borderRadius="md"
                    >
                      <HStack>
                        <Box position="relative" width={[6, 8]} height={[6, 8]}>
                          <Image
                            src={
                              data?.user.image || "/images/default-avatar.png"
                            }
                            alt="Profile picture"
                            fill
                            sizes="100%"
                            style={{
                              borderRadius: "50%",
                              userSelect: "none",
                              pointerEvents: "none",
                            }}
                          />
                        </Box>
                        <Box textAlign="start">
                          <Text fontSize="xs" width={["12", "20"]} isTruncated>
                            {data.user.firstName} {data.user.lastName}
                          </Text>
                          <Text
                            fontWeight="normal"
                            fontSize="xs"
                            width="20"
                            display={["none", "inherit"]}
                            isTruncated
                          >
                            {data.user.email}
                          </Text>
                        </Box>

                        <BsChevronDown
                          size={12}
                          style={{
                            rotate: isOpen ? "-180deg" : "0deg",
                            transition: "all 0.25s",
                          }}
                        />
                      </HStack>
                    </MenuButton>
                    <MenuList>
                      <Link href="/dashboard">
                        <MenuItem icon={<BsFillBarChartFill />}>
                          Dashboard
                        </MenuItem>
                      </Link>
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
                        {colorMode === "light" ? "Dark mode" : "Light mode"}
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
                  </>
                );
              }}
            </Menu>
          )}
        </Flex>
      </Container>
    </header>
  );
};

export default Header;
