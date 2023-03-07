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
import { isEmail, isNotEmpty, useForm } from "@mantine/form";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconAt,
  IconCheck,
} from "@tabler/icons-react";
import Link from "next/link";
import { getServerAuthSession } from "../server/auth";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import Head from "next/head";

const ResetPassword = () => {
  const router = useRouter();

  const form = useForm({
    initialValues: {
      email: router.query.email?.toString() || "",
    },
    validateInputOnBlur: true,
    validate: {
      email: isEmail("Invalid email") || isNotEmpty("Email is required"),
    },
  });

  const requestResetPasswordMutation =
    api.user.requestResetPassword.useMutation({
      onSuccess: () => {
        form.reset();
      },
    });

  return (
    <>
      <Head>
        <title>Reset your password | eBoto Mo</title>
      </Head>
      <Container size={420} my={40}>
        <Title align="center" order={2}>
          Forgot your password?
        </Title>
        <Text color="dimmed" size="sm" align="center" mt={5} mb={30}>
          Enter your email to get a reset link
        </Text>
        {requestResetPasswordMutation.isSuccess ? (
          <Alert icon={<IconCheck />} title="Success!" color="green">
            Please check your email to reset your password.
          </Alert>
        ) : (
          <Paper
            withBorder
            shadow="md"
            sx={(theme) => ({
              padding: theme.spacing.sm,
              [theme.fn.largerThan("xs")]: { padding: theme.spacing.xl },
            })}
            radius="md"
          >
            <form
              onSubmit={form.onSubmit((data) => {
                requestResetPasswordMutation.mutate(data.email);
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
                  disabled={requestResetPasswordMutation.isLoading}
                />

                {requestResetPasswordMutation.isError && (
                  <Alert icon={<IconAlertCircle />} title="Error" color="red">
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
                        Back to login page
                      </Text>
                    </Center>
                  </Anchor>
                  <Button
                    sx={(theme) => ({
                      [theme.fn.smallerThan("xs")]: {
                        width: "100%",
                      },
                    })}
                    type="submit"
                    loading={requestResetPasswordMutation.isLoading}
                  >
                    Reset password
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        )}
      </Container>
    </>
  );
};

export default ResetPassword;

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
