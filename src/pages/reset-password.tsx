import {
  Alert,
  Anchor,
  Button,
  Center,
  Container,
  Group,
  Paper,
  rem,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useRouter } from "next/router";
import { api } from "../utils/api";
import { useEffect } from "react";
import { isEmail, isNotEmpty, useForm } from "@mantine/form";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconAt,
  IconCircleCheck,
} from "@tabler/icons-react";
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
    <Container size={420} my={40}>
      {requestResetPasswordMutation.isSuccess ? (
        <Alert icon={<IconCircleCheck />} title="Success!" color="green">
          Please check your email to reset your password.
        </Alert>
      ) : (
        <>
          <Title align="center" order={2}>
            Forgot your password?
          </Title>
          <Text color="dimmed" size="sm" align="center" mt={5}>
            Enter your email to get a reset link
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

                <Group
                  position="apart"
                  sx={(theme) => ({
                    [theme.fn.smallerThan("xs")]: {
                      flexDirection: "column-reverse",
                    },
                  })}
                >
                  <Anchor
                    color="dimmed"
                    size="sm"
                    sx={(theme) => ({
                      [theme.fn.smallerThan("xs")]: {
                        width: "100%",
                        textAlign: "center",
                      },
                    })}
                    component={Link}
                    href="/signin"
                  >
                    <Center inline>
                      <IconArrowLeft size={rem(12)} stroke={1.5} />
                      <Text size="xs" ml={5}>
                        Back to the login page
                      </Text>
                    </Center>
                  </Anchor>
                  <Button
                    sx={(theme) => ({
                      [theme.fn.smallerThan("xs")]: {
                        width: "100%",
                      },
                    })}
                  >
                    Reset password
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default ResetPassword;
