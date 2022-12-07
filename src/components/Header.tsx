import {
  Avatar,
  Box,
  Button,
  Center,
  Container,
  Hide,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuItemProps,
  MenuList,
  Show,
  Spinner,
  Stack,
  Switch,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import Link from "next/link";
import { ArrowRightIcon, MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import {
  ArchiveBoxArrowDownIcon,
  ArrowDownIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useSession, signOut } from "next-auth/react";
import React, { ReactNode, useEffect, useState } from "react";
import { electionType } from "../types/typings";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebase";
import { useRouter } from "next/router";
import Image from "next/image";

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { data: session, status: sessionStatus } = useSession();
  const [election, setElection] = useState<electionType>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      if (session?.user.accountType === "voter") {
        setLoading(true);
        const electionSnap = await getDoc(
          doc(firestore, "elections", session.user.election)
        );
        setElection(electionSnap.data() as electionType);
        setLoading(false);
      }
    };
    run();
  }, [session]);

  const Hello = ({ email }: { email: string }) => {
    return (
      <Box textAlign="end" color="white">
        <Text fontSize={["xs", "sm"]} fontWeight="semibold" noOfLines={1}>
          <Hide below="sm">Hello, </Hide>@{email.split("@")[0]}!
        </Text>
        <Hide below="sm">
          <Text fontSize={["2xs", "xs"]} noOfLines={1}>
            {email}
          </Text>
        </Hide>
      </Box>
    );
  };

  const MenuParent = ({ children }: { children?: React.ReactNode }) => {
    return (
      <Menu>
        {({ isOpen }) => (
          <>
            <MenuButton
              width={[8, 9]}
              height={[8, 9]}
              padding={2}
              as={IconButton}
              aria-label="Options"
              icon={
                <ChevronDownIcon
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transitionDuration: "0.25s",
                  }}
                  color={!isOpen ? "white" : "black"}
                />
              }
              variant="ghost"
              borderRadius="full"
              size="sm"
              _hover={{ backgroundColor: "gray.700" }}
              _focus={{ backgroundColor: "gray.600" }}
            />
            <MenuList>
              {children}
              <MenuDivider />
              {/* <MenuItem
                icon={<MoonIcon width={18} />}
                closeOnSelect={false}
                onClick={toggleColorMode}
              >
                <HStack justifyContent="space-between">
                  <Text>Dark Mode</Text>

                  <Switch isChecked={colorMode === "dark"} />
                </HStack>
              </MenuItem> */}
              <MenuItem
                icon={<ArrowRightOnRectangleIcon width={18} />}
                onClick={() => signOut({ callbackUrl: "/signin" })}
              >
                Signout
              </MenuItem>
            </MenuList>
          </>
        )}
      </Menu>
    );
  };

  return (
    <Box backgroundColor="gray.800" position="sticky" top={0} zIndex="sticky">
      <Container
        maxW="8xl"
        padding={4}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Link href="/" style={{ minWidth: "fit-content" }}>
          <HStack>
            <Box position="relative" width={8} height={8}>
              <Image
                src="/assets/images/eboto-mo-logo.png"
                alt="eBoto Mo Logo"
                fill
                sizes="contain"
                style={{
                  filter: "invert(1)",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            </Box>
            <Text fontWeight="bold" color="white" fontSize={["unset", "xl"]}>
              eBoto Mo
            </Text>
          </HStack>
        </Link>
        <HStack>
          {(() => {
            switch (sessionStatus) {
              case "loading":
                return <Spinner />;
              case "unauthenticated":
                return (
                  <>
                    <Link href="/signin">
                      <Button
                        size={["sm", "md"]}
                        variant={router.route === "/signin" ? "solid" : "ghost"}
                        color={router.route === "/signin" ? "unset" : "white"}
                        _hover={{
                          backgroundColor:
                            router.route === "/signin"
                              ? "gray.100"
                              : "gray.600",
                        }}
                      >
                        Sign in
                      </Button>
                    </Link>
                    <Hide below="sm">
                      <Link href="/signup">
                        <Button
                          size={["sm", "md"]}
                          variant={
                            router.route === "/signup" ? "solid" : "ghost"
                          }
                          color={router.route === "/signup" ? "unset" : "white"}
                          _hover={{
                            backgroundColor:
                              router.route === "/signup"
                                ? "gray.100"
                                : "gray.600",
                          }}
                        >
                          Sign up
                        </Button>
                      </Link>
                    </Hide>
                  </>
                );
              case "authenticated":
                switch (session.user.accountType) {
                  case "admin":
                    return (
                      <>
                        {session?.user.photoUrl && (
                          <Avatar
                            name={`@${
                              session?.user.firstName +
                              " " +
                              session?.user.lastName
                            }`}
                            src={session?.user.photoUrl}
                            size="sm"
                          />
                        )}
                        <Hello email={session?.user.email} />

                        <MenuParent>
                          <Link href="/dashboard">
                            <MenuItem icon={<ChartBarIcon width={18} />}>
                              Dashboard
                            </MenuItem>
                          </Link>
                        </MenuParent>
                      </>
                    );
                  case "voter":
                    return (
                      <>
                        <Hello email={session?.user.email} />
                        <Show above="md">
                          {!(
                            router.route.split("/").length === 2 &&
                            router.route.split("/")[1] === "[electionIdName]" &&
                            router.query.electionIdName ===
                              election?.electionIdName
                          ) && (
                            <Link href={`/${election?.electionIdName}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                isLoading={loading}
                                rightIcon={<ArrowRightIcon width={14} />}
                                color="gray.50"
                                _hover={{ backgroundColor: "gray.700" }}
                              >
                                Go to {election?.name}
                              </Button>
                            </Link>
                          )}
                        </Show>
                        <MenuParent>
                          <MenuItem
                            icon={<ArchiveBoxArrowDownIcon width={18} />}
                            disabled={loading}
                            onClick={() => {
                              !loading &&
                                router.push(`/${election?.electionIdName}`);
                            }}
                          >
                            <HStack>
                              {loading ? (
                                <Spinner />
                              ) : (
                                <Text>{election?.name}</Text>
                              )}
                            </HStack>
                          </MenuItem>
                        </MenuParent>
                      </>
                    );
                }
            }
          })()}
        </HStack>
      </Container>
    </Box>
  );
};

export default Header;
