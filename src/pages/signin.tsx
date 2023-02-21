import { useState } from "react";

import Head from "next/head";
import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPage,
} from "next";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";

import { useForm } from "react-hook-form";

import { signIn } from "next-auth/react";

// import { AiOutlineGoogle } from "react-icons/ai";
import { getServerAuthSession } from "../server/auth";
import { useRouter } from "next/router";
import Link from "next/link";

const Signin: NextPage = () => {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [loadings, setLoadings] = useState({
    credentials: false,
    google: false,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  return (
    <>
      <Head>
        <title>Sign in to your account | eBoto Mo</title>
      </Head>

      <Container>
        <form
          onSubmit={handleSubmit(async (data) => {
            setError(undefined);
            setLoadings({ ...loadings, credentials: true });

            await signIn("credentials", {
              email: data.email as string,
              password: data.password as string,
              redirect: false,
              callbackUrl: (router.query.callbackUrl as string) || "/dashboard",
            }).then(async (res) => {
              if (res?.ok) await router.push("/dashboard");
              if (res?.error) {
                setError(res.error);

                res.error === "Email not verified. Email verification sent." &&
                  reset();
              }
            });
            setLoadings({ ...loadings, credentials: false });
          })}
        >
          <Stack spacing={4}>
            <FormControl
              isInvalid={!!errors.email}
              isRequired
              isDisabled={loadings.credentials}
            >
              <FormLabel>Email address</FormLabel>
              <Input
                placeholder="Enter your email address"
                type="email"
                {...register("email", {
                  required: "This is required.",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Invalid email address.",
                  },
                })}
              />
              {errors.email && (
                <FormErrorMessage>
                  {errors.email.message?.toString()}
                </FormErrorMessage>
              )}
            </FormControl>
            <FormControl
              isInvalid={!!errors.password}
              isRequired
              isDisabled={loadings.credentials}
            >
              <Flex justifyContent="space-between" alignItems="center">
                <FormLabel>Password</FormLabel>
                <Link href="/forgot-password">
                  <Text
                    fontSize="xs"
                    fontWeight="normal"
                    _hover={{
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    Forgot password?
                  </Text>
                </Link>
              </Flex>
              <Input
                placeholder="Enter your password"
                type="password"
                {...register("password", {
                  required: "This is required.",
                  min: {
                    value: 8,
                    message: "Password must be at least 8 characters.",
                  },
                })}
              />
              {errors.password && (
                <FormErrorMessage>
                  {errors.password.message?.toString()}
                </FormErrorMessage>
              )}

              <Flex justifyContent="end" mt={2}>
                <Link href="/signup">
                  <Text
                    fontSize="xs"
                    fontWeight="normal"
                    _hover={{
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    Don&apos;t have an account? Sign up.
                  </Text>
                </Link>
              </Flex>
            </FormControl>

            {error && (
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>Sign in error.</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" isLoading={loadings.credentials}>
              Sign in
            </Button>

            {/* <Button
              onClick={() => {
                setLoadings({ ...loadings, google: true });
                void (async () => {
                  await signIn("google", {
                    callbackUrl:
                      (router.query.callbackUrl as string) || "/dashboard",
                  });
                })();
              }}
              leftIcon={<AiOutlineGoogle size={18} />}
              variant="outline"
              isLoading={loadings.google}
              loadingText="Loading..."
            >
              Sign in with Google
            </Button> */}
          </Stack>
        </form>
      </Container>
    </>
  );
};

export default Signin;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const session = await getServerAuthSession(context);

  if (session) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
