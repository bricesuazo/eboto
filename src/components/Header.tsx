import {
  Avatar,
  Button,
  Center,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuItemProps,
  MenuList,
  Spinner,
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

  const MenuParent = ({ children }: { children?: React.ReactNode }) => {
    return (
      <Menu>
        {({ isOpen }) => (
          <>
            <MenuButton
              as={IconButton}
              aria-label="Options"
              icon={
                <ChevronDownIcon
                  width={18}
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
              <MenuItem icon={<MoonIcon width={18} />} closeOnSelect={false}>
                <HStack justifyContent="space-between">
                  <Text>Dark Mode</Text>

                  <Switch
                    isChecked={colorMode === "dark"}
                    onChange={(e) => console.log(e)}
                  />
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
      <Link href="/">Logo</Link>
      <HStack>
        {(() => {
          switch (sessionStatus) {
            case "loading":
              return <Spinner />;
            case "unauthenticated":
              return (
                <>
                  <Link href="/signin">
                    <a>
                      <Button>Signin</Button>
                    </a>
                  </Link>
                  <Link href="/signup">
                    <a>
                      <Button>Signup</Button>
                    </a>
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
                      <Text>
                        Hello,{" "}
                        {session?.user.firstName ||
                          session?.user.email?.split("@")[0]}
                        !
                      </Text>
                      <MenuParent>
                        <Link href="/dashboard">
                          <a>
                            <MenuItem icon={<ChartBarIcon width={18} />}>
                              Dashboard
                            </MenuItem>
                          </a>
                        </Link>
                        <MenuDivider />
                      </MenuParent>
                    </>
                  );
                case "voter":
                  return (
                    <>
                      <Text>Hello, {session.user.fullName.split(" ")[0]}!</Text>
                      {!(
                        router.route.split("/").length === 2 &&
                        router.route.split("/")[1] === "[electionIdName]" &&
                        router.query.electionIdName === election?.electionIdName
                      ) && (
                        <Link href={`/${election?.electionIdName}`}>
                          <a>
                            <Button
                              variant="outline"
                              size="sm"
                              isLoading={loading}
                              rightIcon={<ArrowRightIcon width={14} />}
                            >
                              Go to {election?.name}
                            </Button>
                          </a>
                        </Link>
                      )}

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
                        <MenuDivider />
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
