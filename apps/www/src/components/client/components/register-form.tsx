"use client";

import { useState } from "react";
import { Button, Paper, Stack } from "@mantine/core";
import { IconBrandGoogle } from "@tabler/icons-react";
import { signIn } from "next-auth/react";

export default function RegisterForm() {
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
  //     firstName: "",
  //     lastName: "",
  //     password: "",
  //     confirmPassword: "",
  //   },
  //   validateInputOnBlur: true,
  //   validate: {
  //     firstName: hasLength(
  //       { min: 2 },
  //       "First name must be at least 2 characters",
  //     ),
  //     lastName: hasLength(
  //       { min: 2 },
  //       "Last name must be at least 2 characters",
  //     ),
  //     email: isEmail("Invalid email") || isNotEmpty("Email is required"),
  //     password: hasLength({ min: 8 }, "Password must be at least 8 characters"),

  //     confirmPassword: matchesField("password", "Passwords do not match"),
  //   },
  // });

  return (
    <Paper withBorder shadow="md" p="md" radius="md">
      <Stack>
        <Button
          onClick={async () => {
            setLoadings((loadings) => ({ ...loadings, google: true }));

            await signIn("google");
          }}
          loading={loadings.google}
          disabled={loadings.credential}
          leftSection={<IconBrandGoogle size={18} />}
          variant="outline"
        >
          Sign up with Google
        </Button>

        {/* <Divider label="Or continue with email" labelPosition="center" />
        <form
          onSubmit={form.onSubmit(() => {
            // if (!isSignUpLoaded) return;

            setLoadings((loadings) => ({ ...loadings, credential: true }));
            // void (async () => {
            //   await signUp
            //     .create({
            //       emailAddress: values.email,
            //       password: values.password,
            //       firstName: values.firstName,
            //       lastName: values.lastName,
            //       actionCompleteRedirectUrl:
            //         (params?.callbackUrl as string | undefined) ?? "/dashboard",
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
          <Stack gap="sm">
            <Group grow>
              <TextInput
                placeholder="Enter your first name"
                withAsterisk
                label="First name"
                required
                {...form.getInputProps("firstName")}
                leftSection={<IconLetterCase size="1rem" />}
                disabled={loadings.credential}
              />
              <TextInput
                placeholder="Enter your last name"
                withAsterisk
                label="Last name"
                {...form.getInputProps("lastName")}
                disabled={loadings.credential}
                leftSection={<IconLetterCase size="1rem" />}
              />
            </Group>

            <TextInput
              placeholder="Enter your email address"
              type="email"
              withAsterisk
              label="Email"
              required
              leftSection={<IconAt size="1rem" />}
              disabled={loadings.credential}
              {...form.getInputProps("email")}
            />

            <PasswordInput
              placeholder="Enter your password"
              withAsterisk
              label="Password"
              required
              {...form.getInputProps("password")}
              disabled={loadings.credential}
              leftSection={<IconLock size="1rem" />}
            />
            <PasswordInput
              placeholder="Confirm your password"
              withAsterisk
              label="Confirm password"
              required
              {...form.getInputProps("confirmPassword")}
              disabled={loadings.credential}
              leftSection={<IconLock size="1rem" />}
            />

         {signUpMutation.isError && (
                    <Alert
                      leftSection={<IconAlertCircle size="1rem" />}
                      title="Error"
                      color="red"
                    > 
                      {signUpMutation.error.message}
                    </Alert>
                  )} 

            <Button type="submit" loading={loadings.credential} disabled>
              Sign up
            </Button>
          </Stack>
        </form> */}
      </Stack>
    </Paper>
  );
}
