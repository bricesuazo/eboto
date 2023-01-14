import {
  Avatar,
  Box,
  Button,
  Container,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Spinner,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import {
  ArchiveBoxArrowDownIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { doc, getDoc } from "firebase/firestore";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { firestore } from "../firebase/firebase";
import { electionType } from "../types/typings";

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
        <Box display={["inherit", "inherit", "none"]}>
          <Text fontSize={["xs", "sm"]} fontWeight="semibold" noOfLines={1}>
            @{email.split("@")[0]}!
          </Text>
        </Box>
        <Box display={["none", "none", "inherit"]}>
          <Text fontSize={["xs", "sm"]} fontWeight="semibold" noOfLines={1}>
            Hello, @{email.split("@")[0]}!
          </Text>
        </Box>

        <Box display={["none", "none", "inherit"]}>
          <Text fontSize={["2xs", "xs"]} noOfLines={1}>
            {email}
          </Text>
        </Box>
      </Box>
    );
  };

  const MenuParent = ({ children }: { children?: React.ReactNode }) => {
    return (
      <Menu placement="bottom-end">
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
            <MenuList
              minWidth={["40", "3xs"]}
              paddingTop={[1, 2]}
              paddingBottom={[1, 2]}
            >
              {children}
              <MenuDivider marginTop={[1, 2]} marginBottom={[1, 2]} />
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
                icon={
                  <Icon
                    as={ArrowRightOnRectangleIcon}
                    w={[4, 5]}
                    h={[4, 5]}
                    display="grid"
                    placeItems="center"
                  />
                }
                onClick={() => signOut({ callbackUrl: "/signin" })}
              >
                <Text fontSize={["sm", "md"]}>Signout</Text>
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

                    <Box display={["none", "inherit"]}>
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
                    </Box>
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
                            <MenuItem
                              icon={
                                <Icon
                                  as={ChartBarIcon}
                                  w={[4, 5]}
                                  h={[4, 5]}
                                  display="grid"
                                  placeItems="center"
                                />
                              }
                            >
                              <Text fontSize={["sm", "md"]}>Dashboard</Text>
                            </MenuItem>
                          </Link>
                        </MenuParent>
                      </>
                    );
                  case "voter":
                    return (
                      <>
                        <Hello email={session?.user.email} />
                        <Box display={["none", "none", "inherit"]}>
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
                                Go to{" "}
                                {election && election.name.length > 8
                                  ? election?.name.slice(0, 8) + "..."
                                  : election?.name}
                              </Button>
                            </Link>
                          )}
                        </Box>
                        <MenuParent>
                          <MenuItem
                            icon={
                              <Icon
                                as={ArchiveBoxArrowDownIcon}
                                w={[4, 5]}
                                h={[4, 5]}
                                display="grid"
                                placeItems="center"
                              />
                            }
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
                                <Text fontSize={["sm", "md"]}>
                                  {election?.name}
                                </Text>
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
