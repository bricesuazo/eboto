import {
  Avatar,
  Button,
  Center,
  HStack,
  IconButton,
  Spinner,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import Link from "next/link";
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useSession, signOut } from "next-auth/react";

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { data: session, status } = useSession();

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

        {status === "loading" ? (
          <Spinner />
        ) : session?.user ? (
          <>
            {session?.user.photoUrl && (
              <Avatar
                name={`@${
                  session?.user.firstName + " " + session?.user.lastName
                }`}
                src={session?.user.photoUrl}
                size="sm"
              />
            )}
            <Text>
              Hello,{" "}
              {session?.user.firstName || session?.user.email?.split("@")[0]}!
            </Text>
            <IconButton
              aria-label="Toggle theme"
              icon={<ArrowRightOnRectangleIcon width={24} />}
              onClick={() => signOut({ redirect: false })}
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
