import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPage,
} from "next";
import NextLink from "next/link";
import {
  Button,
  Center,
  Container,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Link,
  Flex,
  Alert,
  AlertIcon,
  AlertDescription,
  Box,
  Hide,
  Text,
} from "@chakra-ui/react";

import { useState } from "react";

import Head from "next/head";

import { getSession, signIn } from "next-auth/react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { firestore } from "../firebase/firebase";
import Image from "next/image";

const SigninPage: NextPage = () => {
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  }>({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Head>
        <title>Sign in | eBoto Mo</title>
      </Head>
      <Flex height="80vh">
        <Hide below="md">
          <Box position="relative" flex={1} height="full">
            <Image
              src="/assets/images/cvsu-front.jpg"
              alt="CvSU Front"
              fill
              sizes="contain"
              priority
              style={{ objectFit: "cover" }}
            />
          </Box>
        </Hide>

        <Box flex={1}>
          <Container
            maxW="sm"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            height="full"
            gap={8}
          >
            <Text fontSize="xl" fontWeight="bold" textAlign="center">
              Sign in to your account
            </Text>
            <form
              style={{ width: "100%" }}
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setLoading(true);

                if (!credentials.email || !credentials.password) {
                  setLoading(false);
                  return;
                }

                await signIn<"credentials">("credentials", {
                  email: credentials.email.trim().toLocaleLowerCase(),
                  password: credentials.password,
                }).then((res) => {
                  setError(res?.error || null);
                });

                setLoading(false);
              }}
            >
              <Stack width="100%">
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    autoFocus
                    placeholder="Email"
                    type="email"
                    value={credentials.email}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        email: e.target.value,
                      })
                    }
                    disabled={loading}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input
                    placeholder="Password"
                    type="password"
                    minLength={8}
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        password: e.target.value,
                      })
                    }
                    disabled={loading}
                  />
                </FormControl>
                {error && (
                  <Alert status="error">
                    <AlertIcon />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Flex justifyContent="space-between">
                  <NextLink href="/signup" passHref>
                    <Link fontSize="xs">Create account as admin?</Link>
                  </NextLink>
                  <NextLink href="/forgot-password" passHref>
                    <Link fontSize="xs">Forgot password?</Link>
                  </NextLink>
                </Flex>
                <Button
                  type="submit"
                  isLoading={loading}
                  disabled={
                    loading ||
                    !credentials.email ||
                    !credentials.email.match(
                      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                    ) ||
                    !credentials.password ||
                    credentials.password.length < 8
                  }
                >
                  Sign in
                </Button>
              </Stack>
            </form>
          </Container>
        </Box>
      </Flex>
    </>
  );
};

export default SigninPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const session = await getSession(context);
  if (!session) {
    return { props: {} };
  }
  if (session.user.accountType === "voter") {
    const electionSnapshot = await getDoc(
      doc(firestore, "elections", session.user.election)
    );

    return {
      redirect: {
        destination: `/${electionSnapshot.data()?.electionIdName}`,
        permanent: false,
      },
    };
  } else if (session.user.accountType === "admin") {
    if (session.user.elections.length === 0) {
      return {
        redirect: {
          destination: "/create-election",
          permanent: false,
        },
      };
    }
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }
  return { props: {} };
};
