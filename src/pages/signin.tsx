import { useState } from "react";

import Head from "next/head";
import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPage,
} from "next";

import {
  Alert,
  Anchor,
  Box,
  Button,
  Center,
  Container,
  PasswordInput,
  Stack,
  TextInput,
} from "@mantine/core";

import { signIn } from "next-auth/react";

// import { AiOutlineGoogle } from "react-icons/ai";
import { getServerAuthSession } from "../server/auth";
import { useRouter } from "next/router";
import Link from "next/link";
import { hasLength, isEmail, isNotEmpty, useForm } from "@mantine/form";
import { IconAlertCircle, IconAt, IconLock } from "@tabler/icons-react";

const Signin: NextPage = () => {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [loadings, setLoadings] = useState({
    credentials: false,
    google: false,
  });

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validateInputOnBlur: true,
    validate: {
      email: isEmail("Invalid email") || isNotEmpty("Email is required"),
      password: hasLength({ min: 8 }, "Password must be at least 8 characters"),
    },
  });

  return (
    <>
      <Head>
        <title>Sign in to your account | eBoto Mo</title>
      </Head>

      <Container size="xs">
        <form
          onSubmit={form.onSubmit((values) => {
            setError(undefined);
            setLoadings({ ...loadings, credentials: true });

            void (async () => {
              await signIn("credentials", {
                email: values.email,
                password: values.password,
                redirect: false,
                callbackUrl:
                  (router.query.callbackUrl as string) || "/dashboard",
              }).then(async (res) => {
                if (res?.ok)
                  await router.push(
                    (router.query.callbackUrl as string) || "/dashboard"
                  );
                if (res?.error) {
                  setError(res.error);

                  res.error ===
                    "Email not verified. Email verification sent." &&
                    form.reset();

                  setLoadings({ ...loadings, credentials: false });
                }
              });
            })();
          })}
        >
          <Stack spacing="sm">
            <TextInput
              placeholder="Enter your email address"
              type="email"
              withAsterisk
              label="Email"
              required
              {...form.getInputProps("email")}
              icon={<IconAt size="1rem" />}
            />

            <Box>
              <PasswordInput
                placeholder="Enter your password"
                withAsterisk
                label="Password"
                required
                {...form.getInputProps("password")}
                icon={<IconLock size="1rem" />}
              />
              <Anchor
                size="sm"
                variant=""
                component={Link}
                href={`/reset-password${
                  form.values.email ? `?email=${form.values.email}` : ""
                }`}
              >
                Forgot password?
              </Anchor>
            </Box>

            {error && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Error"
                color="red"
              >
                {error}
              </Alert>
            )}

            <Button type="submit" loading={loadings.credentials}>
              Sign in
            </Button>

            <Center>
              <Anchor component={Link} href="/signup" size="sm">
                Don&apos;t have an account? Sign up.
              </Anchor>
            </Center>

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
              loading={loadings.google}
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
