import {
  Avatar,
  Box,
  Button,
  Center,
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
      <Box textAlign="end">
        <Text
          fontSize={["xs", "sm"]}
          color={colorMode === "dark" ? "whiteAlpha.800" : "black"}
          fontWeight="semibold"
        >
          Hello, @{email.split("@")[0]}!
        </Text>
        <Text
          fontSize={["2xs", "xs"]}
          color={colorMode === "dark" ? "whiteAlpha.500" : "black"}
        >
          {email}
        </Text>
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
                    transitionDuration: "0.5s",
                  }}
                />
              }
              variant="ghost"
              borderRadius="full"
              size="sm"
            />
            <MenuList>
              {children}
              <MenuDivider />
              <MenuItem
                icon={<MoonIcon width={18} />}
                closeOnSelect={false}
                onClick={toggleColorMode}
              >
                <HStack justifyContent="space-between">
                  <Text>Dark Mode</Text>

                  <Switch isChecked={colorMode === "dark"} />
                </HStack>
              </MenuItem>
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
    <Center padding={4} justifyContent="space-between">
      <Link href="/">
        <Text>Logo</Text>
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
                    <Button>Signin</Button>
                  </Link>
                  <Link href="/signup">
                    <Button>Signup</Button>
                  </Link>
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
                      <Show above="sm">
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
    </Center>
  );
};

export default Header;
