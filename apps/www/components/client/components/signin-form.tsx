"use client";

import { useSignIn } from "@clerk/nextjs";
import {
  Anchor,
  Button,
  Center,
  Checkbox,
  Divider,
  Group,
  Paper,
  PasswordInput,
  Stack,
  TextInput,
} from "@mantine/core";
import { hasLength, isEmail, isNotEmpty, useForm } from "@mantine/form";
import { IconAt, IconBrandGoogle, IconLock } from "@tabler/icons-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function SigninForm() {
  const [loadings, setLoadings] = useState<{
    google: boolean;
    credential: boolean;
  }>({
    google: false,
    credential: false,
  });
  const { isLoaded, signIn, setActive } = useSignIn();
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

  const params = useParams();

  return (
    <Paper withBorder shadow="md" mt={30} radius="md" p="md">
      <Stack>
        <Button
          onClick={() => {
            if (!isLoaded) return;
            setLoadings((loadings) => ({ ...loadings, google: true }));
            void (async () => {
              await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete:
                  params?.callbackUrl?.toString() ?? "/dashboard",
              });
            })();
          }}
          leftSection={<IconBrandGoogle size={18} />}
          variant="outline"
          disabled={loadings.credential}
          loading={loadings.google}
        >
          Sign in with Google
        </Button>
        <Divider label="Or continue with email" labelPosition="center" />
        <form
          onSubmit={form.onSubmit((values) => {
            setLoadings((loadings) => ({ ...loadings, credential: true }));
            if (!isLoaded) return;
            void (async () => {
              await signIn
                .create({
                  identifier: values.email,
                  password: values.password,
                  redirectUrl: params?.callbackUrl?.toString() ?? "/dashboard",
                })
                .then(async (result) => {
                  if (result.status === "complete") {
                    console.log(result);
                    await setActive({ session: result.createdSessionId });
                  } else {
                    console.log(result);
                  }
                })
                .catch((err) => console.error("error", err));
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
              leftSection={<IconAt size="1rem" />}
              disabled={loadings.credential || loadings.google}
            />

            <PasswordInput
              placeholder="Enter your password"
              withAsterisk
              label="Password"
              required
              {...form.getInputProps("password")}
              leftSection={<IconLock size="1rem" />}
              disabled={loadings.credential || loadings.google}
            />
            <Group justify="space-between">
              <Checkbox
                label="Remember me"
                size="sm"
                disabled={loadings.credential || loadings.google}
              />

              <Anchor
                size="sm"
                visibleFrom="xs"
                component={Link}
                href={`/reset-password${
                  form.values.email ? `?email=${form.values.email}` : ""
                }`}
              >
                Forgot password?
              </Anchor>
            </Group>

            {/* {error && (
                <Alert
                  leftSection={<IconAlertCircle size="1rem" />}
                  title="Error"
                  color="red"
                >
                  {error}
                </Alert>
              )} */}

            <Button
              type="submit"
              loading={loadings.credential}
              disabled={loadings.google}
            >
              Sign in
            </Button>

            <Center hiddenFrom="xs">
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
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}
