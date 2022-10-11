import {
  Avatar,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Icon,
  IconButton,
  Spinner,
  Stack,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebase";
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import Router from "next/router";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

const Header = () => {
  const [user, loading, error] = useAuthState(auth);
  const { colorMode, toggleColorMode } = useColorMode();
  // console.log("user", user);

  return (
    <Center padding={4} justifyContent="space-between">
      <Link href="/">Logo</Link>
      <HStack>
        <IconButton
          aria-label="Toggle theme"
          icon={
            colorMode !== "light" ? (
              <SunIcon width={24} />
            ) : (
              <MoonIcon width={24} />
            )
          }
          variant="ghost"
          onClick={toggleColorMode}
        />

        {loading ? (
          <Spinner />
        ) : user ? (
          <>
            {user.photoURL && (
              <Avatar
                name={`@${user.displayName || user.email?.split("@")[0]}`}
                src={user.photoURL}
                size="sm"
              />
            )}
            <Text>Hello, {user.displayName || user.email?.split("@")[0]}!</Text>
            <IconButton
              aria-label="Toggle theme"
              icon={<ArrowRightOnRectangleIcon width={24} />}
              onClick={async () => {
                await signOut(auth);
              }}
              variant="ghost"
              borderRadius="full"
            />
          </>
        ) : (
          <>
            <Link href="/signin">
              <Button>Signin</Button>
            </Link>
            <Link href="/signup">
              <Button>Signup</Button>
            </Link>
          </>
        )}
      </HStack>
    </Center>
  );
};

export default Header;
