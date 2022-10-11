import type { NextPage } from "next";
import NextLink from "next/link";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Center,
  Container,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Link,
  Stack,
} from "@chakra-ui/react";
import { useState } from "react";
import { useSendEmailVerification } from "react-firebase-hooks/auth";
import { auth, firestore } from "../firebase/firebase";
import Head from "next/head";
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import Router from "next/router";

const SignupPage: NextPage = () => {
  const [sendEmailVerification, sending] = useSendEmailVerification(auth);
  const [passwordError, setPasswordError] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  return (
    <>
      <Head>
        <title>Signup | eBoto Mo</title>
      </Head>
      <Center height="80vh">
        <Container maxW="sm">
          <Center>
            <form
              style={{ width: "100%" }}
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                setPasswordError(false);

                if (credentials.password !== credentials.confirmPassword) {
                  setPasswordError(true);
                  setLoading(false);
                  return;
                }
                await createUserWithEmailAndPassword(
                  auth,
                  credentials.email,
                  credentials.password
                )
                  .then(async (userSnapshot) => {
                    await setDoc(
                      doc(firestore, "admins", userSnapshot.user.uid),
                      {
                        accountType: "admin",
                        id: uuidv4(),
                        email: credentials.email,
                        firstName: credentials.firstName?.replace(
                          /(^\w{1})|(\s+\w{1})/g,
                          (letter: string) => letter.toUpperCase()
                        ),
                        lastName: credentials.firstName?.replace(
                          /(^\w{1})|(\s+\w{1})/g,
                          (letter: string) => letter.toUpperCase()
                        ),
                        photoUrl: "",
                        elections: [],
                      }
                    )
                      .then(() => Router.push("/dashboard"))
                      .catch((error: FirebaseError) => {
                        setError(error.message);
                      });
                  })
                  .catch((error: FirebaseError) => {
                    setError(error.code);
                  });
                setLoading(false);
                return;

                // if (user !== null) {
                //   sendEmailVerification();
                // }
              }}
            >
              <Stack width="100%" spacing={4}>
                <Stack>
                  <HStack>
                    <FormControl isRequired>
                      <FormLabel>First name</FormLabel>
                      <Input
                        autoFocus
                        placeholder="First name"
                        type="text"
                        onChange={(e) =>
                          setCredentials({
                            ...credentials,
                            firstName: e.target.value,
                          })
                        }
                        disabled={loading}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Last name</FormLabel>
                      <Input
                        placeholder="Last name"
                        type="text"
                        onChange={(e) =>
                          setCredentials({
                            ...credentials,
                            lastName: e.target.value,
                          })
                        }
                        disabled={loading}
                      />
                    </FormControl>
                  </HStack>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
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
                      onChange={(e) => {
                        setCredentials({
                          ...credentials,
                          password: e.target.value,
                        });
                        setPasswordError(false);
                      }}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Confirm password</FormLabel>
                    <Input
                      placeholder="Confirm password"
                      type="password"
                      minLength={8}
                      onChange={(e) => {
                        setCredentials({
                          ...credentials,
                          confirmPassword: e.target.value,
                        });
                        setPasswordError(false);
                      }}
                      disabled={loading}
                    />
                  </FormControl>
                  {error ||
                    (passwordError && (
                      <Alert status="error">
                        <AlertIcon />
                        <AlertDescription>
                          {error || (passwordError && "Passwords don't match")}
                        </AlertDescription>
                      </Alert>
                    ))}
                  <NextLink href="/signin" passHref>
                    <Link fontSize="xs">Already have an account?</Link>
                  </NextLink>
                </Stack>
                <Button type="submit" isLoading={loading}>
                  Signup
                </Button>
              </Stack>
            </form>
          </Center>
        </Container>
      </Center>
    </>
  );
};

export default SignupPage;
