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
  Stack,
  TextInput,
} from "@mantine/core";
import { hasLength, isEmail, isNotEmpty, useForm } from "@mantine/form";
import { IconAt, IconBrandGoogle, IconLock } from "@tabler/icons-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function SigninForm() {
  const [loading, setLoading] = useState(false);
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
            void (async () => {
              await signIn.create({
                strategy: "oauth_google",
                transfer: true,
                redirectUrl: (params.callbackUrl as string) ?? "/dashboard",
              });
            })();
          }}
          disabled={loading}
          leftSection={<IconBrandGoogle size={18} />}
          variant="outline"
          // loading={loadings.google}
        >
          Sign in with Google
        </Button>
        <Divider label="Or continue with email" labelPosition="center" />
        <form
          onSubmit={form.onSubmit((values) => {
            setLoading(true);
            if (!isLoaded) return;
            void (async () => {
              await signIn
                .create({
                  identifier: values.email,
                  password: values.password,
                  redirectUrl: (params.callbackUrl as string) ?? "/dashboard",
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
              disabled={loading}
            />

            <TextInput
              type="password"
              placeholder="Enter your password"
              withAsterisk
              label="Password"
              required
              {...form.getInputProps("password")}
              leftSection={<IconLock size="1rem" />}
              disabled={loading}
            />
            <Group justify="space-between">
              <Checkbox
                label="Remember me"
                size="sm"
                //   disabled={loading }
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

            <Button type="submit" loading={loading}>
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
