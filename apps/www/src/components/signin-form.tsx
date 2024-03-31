"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Anchor, Button, Paper, Stack, Text } from "@mantine/core";
import Balancer from "react-wrap-balancer";

export default function SigninForm() {
  const searchParams = useSearchParams();
  const [loadings, setLoadings] = useState<{
    google: boolean;
    credential: boolean;
  }>({
    google: false,
    credential: false,
  });
  // const form = useForm({
  //   initialValues: {
  //     email: "",
  //     password: "",
  //   },
  //   : true,
  //   validate: {
  //     email: isEmail("Invalid email") || isNotEmpty("Email is required"),
  //     password: hasLength({ min: 8 }, "Password must be at least 8 characters"),
  //   },
  // });

  // const params = useParams();

  return (
    <Paper radius="md" p="xl" withBorder shadow="md">
      <Stack>
        <Stack gap="xs">
          <Text ta="center">
            <Balancer ratio={0.5} preferNative={false}>
              Welcome to eBoto, sign in with
            </Balancer>
          </Text>
          <Button
            radius="xl"
            onClick={async () => {
              setLoadings((loadings) => ({ ...loadings, google: true }));

              const callbackUrl = searchParams.get("callbackUrl");
              await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: callbackUrl ? callbackUrl : undefined,
                },
              });
            }}
            loading={loadings.google}
            disabled={loadings.credential}
            leftSection={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid"
                viewBox="0 0 256 262"
                style={{ width: "0.9rem", height: "0.9rem" }}
              >
                <path
                  fill="#4285F4"
                  d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                />
                <path
                  fill="#34A853"
                  d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                />
                <path
                  fill="#FBBC05"
                  d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                />
                <path
                  fill="#EB4335"
                  d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                />
              </svg>
            }
            variant="default"
          >
            Google
          </Button>
        </Stack>
        {/* <Divider label="Or continue with email" labelPosition="center" />
        <Stack gap="xs">
          <TextInput
            required
            label="Email"
            placeholder="brice@eboto.com"
            disabled
          />

          <Button disabled>Send magic link (soon)</Button>
        </Stack> */}

        {/* <Divider label="Or continue with email" labelPosition="center" />
          <form
            onSubmit={form.onSubmit(() => {
              setLoadings((loadings) => ({ ...loadings, credential: true }));
              // if (!isLoaded) return;
              // void (async () => {
              //   await signIn
              //     .create({
              //       identifier: values.email,
              //       password: values.password,
              //       redirectUrl: params?.callbackUrl?.toString() ?? "/dashboard",
              //     })
              //     .then(async (result) => {
              //       if (result.status === "complete") {
              //         console.log(result);
              //         await setActive({ session: result.createdSessionId });
              //       } else {
              //         console.log(result);
              //       }
              //     })
              //     .catch((err) => console.error("error", err));
              // })();
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
  
              {error && (
                  <Alert
                    leftSection={<IconAlertCircle size="1rem" />}
                    title="Error"
                    color="red"
                  >
                    {error}
                  </Alert>
         
  
              <Button
                type="submit"
                loading={loadings.credential}
                disabled={loadings.google || true}
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
          </form> */}
        <Text size="sm" ta="center">
          By signing in, you agree to our{" "}
          <Anchor component={Link} href="/terms" target="_blank">
            Terms of Service
          </Anchor>{" "}
          and{" "}
          <Anchor component={Link} href="/privacy" target="_blank">
            Privacy Policy
          </Anchor>
          .
        </Text>
      </Stack>
    </Paper>
  );
}
