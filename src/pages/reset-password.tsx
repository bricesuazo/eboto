import {
  Alert,
  Anchor,
  Button,
  Center,
  Container,
  Stack,
  TextInput,
} from "@mantine/core";
import { useRouter } from "next/router";
import { api } from "../utils/api";
import { useEffect } from "react";
import { isEmail, isNotEmpty, useForm } from "@mantine/form";
import { IconAlertCircle, IconAt, IconCircleCheck } from "@tabler/icons-react";
import Link from "next/link";

const ResetPassword = () => {
  const router = useRouter();

  const form = useForm({
    initialValues: {
      email: "",
    },
    validateInputOnBlur: true,
    validate: {
      email: isEmail("Invalid email") || isNotEmpty("Email is required"),
    },
  });

  useEffect(() => {
    if (router.query.email && typeof router.query.email === "string") {
      form.setValues({ email: router.query.email });
    }
  }, [router.query.email]);

  const requestResetPasswordMutation =
    api.user.requestResetPassword.useMutation();

  return (
    <Container size="xs">
      {requestResetPasswordMutation.isSuccess ? (
        <Alert icon={<IconCircleCheck />} title="Success!" color="green">
          Please check your email to reset your password.
        </Alert>
      ) : (
        <form
          onSubmit={form.onSubmit((data) => {
            void (async () => {
              await requestResetPasswordMutation.mutateAsync(data.email);
              form.reset();
            })();
          })}
        >
          <Stack spacing="sm">
            <TextInput
              placeholder="Enter your email"
              type="email"
              withAsterisk
              label="Email"
              required
              icon={<IconAt size="1rem" />}
              {...form.getInputProps("email")}
            />

            {requestResetPasswordMutation.isError && (
              <Alert
                icon={<IconAlertCircle size="1rem" />}
                title="Reset password error"
                color="red"
              >
                {requestResetPasswordMutation.error?.message}
              </Alert>
            )}

            <Button
              type="submit"
              loading={requestResetPasswordMutation.isLoading}
            >
              Reset password
            </Button>
            <Center>
              <Anchor component={Link} href="/signin" size="sm">
                Remembered your password? Sign in.
              </Anchor>
            </Center>
          </Stack>
        </form>
      )}
    </Container>
  );
};

export default ResetPassword;
