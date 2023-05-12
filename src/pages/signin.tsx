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
  Button,
  MediaQuery,
  Container,
  PasswordInput,
  Stack,
  TextInput,
  Title,
  Text,
  Paper,
  Group,
  Checkbox,
  Center,
  Divider,
} from "@mantine/core";

import { signIn } from "next-auth/react";

import { getServerAuthSession } from "../server/auth";
import { useRouter } from "next/router";
import Link from "next/link";
import { hasLength, isEmail, isNotEmpty, useForm } from "@mantine/form";
import {
  IconAlertCircle,
  IconAt,
  IconBrandGoogle,
  IconLock,
} from "@tabler/icons-react";

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

      <Container size={420} my={40}>
        <Title align="center" order={2}>
          Welcome back!
        </Title>
        <Text color="dimmed" size="sm" align="center" mt={5}>
          Don&apos;t have an account yet?{" "}
          <Anchor size="sm" component={Link} href="/signup" truncate>
            Create account
          </Anchor>
        </Text>
        <Paper
          withBorder
          shadow="md"
          sx={(theme) => ({
            padding: theme.spacing.sm,
            [theme.fn.largerThan("xs")]: { padding: theme.spacing.xl },
          })}
          mt={30}
          radius="md"
        >
          <Stack>
            <Button
              onClick={() => {
                setLoadings({ ...loadings, google: true });
                void (async () => {
                  await signIn("google", {
                    callbackUrl:
                      (router.query.callbackUrl as string) || "/dashboard",
                  });
                })();
              }}
              disabled={loadings.credentials}
              leftIcon={<IconBrandGoogle size={18} />}
              variant="outline"
              loading={loadings.google}
            >
              Sign in with Google
            </Button>

            <Divider label="Or continue with email" labelPosition="center" />

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
              <Stack>
                <TextInput
                  placeholder="Enter your email address"
                  type="email"
                  withAsterisk
                  label="Email"
                  required
                  {...form.getInputProps("email")}
                  icon={<IconAt size="1rem" />}
                  disabled={loadings.credentials || loadings.google}
                />

                <PasswordInput
                  placeholder="Enter your password"
                  withAsterisk
                  label="Password"
                  required
                  {...form.getInputProps("password")}
                  icon={<IconLock size="1rem" />}
                  disabled={loadings.credentials || loadings.google}
                />
                <Group position="apart">
                  <Checkbox
                    label="Remember me"
                    size="sm"
                    disabled={loadings.credentials || loadings.google}
                  />
                  <MediaQuery smallerThan="xs" styles={{ display: "none" }}>
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
                  </MediaQuery>
                </Group>

                {error && (
                  <Alert
                    icon={<IconAlertCircle size="1rem" />}
                    title="Error"
                    color="red"
                  >
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  loading={loadings.credentials}
                  disabled={loadings.google}
                >
                  Sign in
                </Button>

                <MediaQuery largerThan="xs" styles={{ display: "none" }}>
                  <Center>
                    <Anchor
                      size="sm"
                      variant=""
                      component={Link}
                      href={`/reset-password${
                        form.values.email ? `?email=${form.values.email}` : ""
                      }`}
                    >
                      Forgot your password?
                    </Anchor>
                  </Center>
                </MediaQuery>
              </Stack>
            </form>
          </Stack>
        </Paper>
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
