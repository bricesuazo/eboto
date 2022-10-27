import type { NextPage } from "next";
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
  Text,
  Spinner,
} from "@chakra-ui/react";

import { useState } from "react";

import Head from "next/head";

import { signIn } from "next-auth/react";

const SigninPage = () => {
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  }>({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Head>
        <title>Signin | eBoto Mo</title>
      </Head>
      <Center height="80vh">
        <Container maxW="sm">
          <Stack spacing={10}>
            <Center>
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
                    redirect: false,
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
                    Signin
                  </Button>

                  {/* <Button
                  leftIcon={
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
                      width={20}
                    />
                  }
                  onClick={() => signInWithGoogle()}
                  isLoading={loadingGoogle || loadingCredential}
                >
                  Signin as Google
                </Button> */}
                </Stack>
              </form>
            </Center>
          </Stack>
        </Container>
      </Center>
    </>
  );
};

export default SigninPage;
