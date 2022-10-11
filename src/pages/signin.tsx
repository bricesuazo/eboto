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
import {
  useAuthState,
  useSendEmailVerification,
  useSignInWithEmailAndPassword,
  useSignInWithGoogle,
} from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebase";
import { useEffect, useState } from "react";

import Head from "next/head";
import Router, { useRouter } from "next/router";
import { FirebaseError } from "firebase/app";
import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
} from "firebase/auth";

const SigninPage = () => {
  const [
    signInWithEmailAndPassword,
    userCredential,
    loadingCredential,
    errorCredential,
  ] = useSignInWithEmailAndPassword(auth);
  const [signInWithGoogle, userGoogle, loadingGoogle, errorGoogle] =
    useSignInWithGoogle(auth);

  const [sendEmailVerification, sending] = useSendEmailVerification(auth);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  }>({ email: "", password: "" });
  const [email, setEmail] = useState("");
  const [passwordLessLoading, setPasswordLessLoading] = useState(false);

  // const [user] = useAuthState(auth);
  // console.log(user);

  // useEffect(() => {
  //   const run = async () => {
  //     setPasswordLessLoading(true);
  //     if (isSignInWithEmailLink(auth, window.location.href)) {
  //       let confirmEmail = window.localStorage.getItem("emailForSignIn");
  //       if (!confirmEmail) {
  //         confirmEmail = window.prompt(
  //           "Please provide your email for confirmation"
  //         );
  //       }
  //       await signInWithEmailLink(auth, confirmEmail, window.location.href)
  //         .then((result) => {
  //           console.log(result);
  //           // Clear email from storage.
  //           window.localStorage.removeItem("emailForSignIn");
  //         })
  //         .catch((error) => {
  //           console.log("signInWithEmailLink", error);
  //         });
  //     }
  //     setPasswordLessLoading(false);
  //   };
  //   run();
  // }, []);

  return (
    <>
      <Head>
        <title>Signin | eBoto Mo</title>
      </Head>
      <Center height="80vh">
        <Container maxW="sm">
          <Stack spacing={10}>
            {/* {passwordLessLoading ? (
              <Spinner />
            ) : typeof window !== "undefined" &&
              !window.localStorage.getItem("emailForSignIn") ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await sendSignInLinkToEmail(auth, email, {
                    url: "http://localhost:3000/signin",
                    handleCodeInApp: true,
                  })
                    .then(() => {
                      window.localStorage.setItem("emailForSignIn", email);
                    })
                    .catch((error) => {
                      console.log("sendSignInLinkToEmail", error);
                    });
                }}
              >
                <Stack>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      autoFocus
                      placeholder="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loadingCredential || loadingGoogle}
                    />
                  </FormControl>
                  <Button
                    type="submit"
                    isLoading={loadingGoogle || loadingCredential}
                  >
                    Signin using Email
                  </Button>
                </Stack>
              </form>
            ) : (
              <Box>
                <Text>Email sent</Text>
              </Box>
            )} */}

            <Center>
              <form
                style={{ width: "100%" }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  await signInWithEmailAndPassword(
                    credentials.email,
                    credentials.password
                  ).finally(() => Router.push("/dashboard"));
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
                      disabled={loadingCredential || loadingGoogle}
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
                      disabled={loadingCredential || loadingGoogle}
                    />
                  </FormControl>
                  {errorCredential && (
                    <Alert status="error">
                      <AlertIcon />
                      <AlertDescription>
                        {errorCredential.code}
                      </AlertDescription>
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
                    isLoading={loadingGoogle || loadingCredential}
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
