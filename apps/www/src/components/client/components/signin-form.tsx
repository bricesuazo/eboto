"use client";

import { useState } from "react";
import { api } from "@/trpc/client";
// import { useParams } from "next/navigation";
import { Button, Group, Paper, Stack, Text, TextInput } from "@mantine/core";
import { IconBrandGoogle } from "@tabler/icons-react";
import { signIn } from "next-auth/react";

export default function SigninForm() {
  const isPasswordCorrectMutation = api.user.isPasswordCorrect.useMutation();
  const [password, setPassword] = useState("");
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
  //   validateInputOnBlur: true,
  //   validate: {
  //     email: isEmail("Invalid email") || isNotEmpty("Email is required"),
  //     password: hasLength({ min: 8 }, "Password must be at least 8 characters"),
  //   },
  // });

  // const params = useParams();

  return (
    <>
      <Paper withBorder shadow="md" mt={30} radius="md" p="md">
        <Stack>
          {(process.env.NODE_ENV === "production" &&
            isPasswordCorrectMutation.data === undefined) ||
          !isPasswordCorrectMutation.data ? (
            <Text>
              This website is currently in development. Please check back later.
            </Text>
          ) : (
            <Button
              onClick={() => {
                setLoadings((loadings) => ({ ...loadings, google: true }));
                void (async () => {
                  await signIn("google");
                })();
              }}
              leftSection={<IconBrandGoogle size={18} />}
              variant="outline"
              disabled={loadings.credential}
              loading={loadings.google}
            >
              Sign in with Google
            </Button>
          )}
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
        </Stack>
      </Paper>

      {process.env.NODE_ENV === "production" &&
        (isPasswordCorrectMutation.data === undefined ||
          !isPasswordCorrectMutation.data) && (
          <Stack p="md">
            <Text size="sm" ta="center">
              If you are the developer, please enter the password to continue.
            </Text>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                isPasswordCorrectMutation.mutate(password);
              }}
            >
              <Group>
                <TextInput
                  placeholder="Password"
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  style={{ flex: 1 }}
                />
                <Button type="submit">Submit</Button>
              </Group>
            </form>
          </Stack>
        )}
    </>
  );
}