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
  Container,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import { getServerAuthSession } from "../server/auth";
import Link from "next/link";
import {
  hasLength,
  isEmail,
  isNotEmpty,
  matchesField,
  useForm,
} from "@mantine/form";
import {
  IconAlertCircle,
  IconAt,
  IconLetterCase,
  IconLock,
} from "@tabler/icons-react";
import { api } from "../utils/api";
import { useDisclosure } from "@mantine/hooks";

const Signup: NextPage = () => {
  const [visible, { toggle }] = useDisclosure(false);
  const signUpMutation = api.user.signUp.useMutation();

  const form = useForm({
    initialValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
    validateInputOnBlur: true,
    validate: {
      firstName: hasLength(
        { min: 2 },
        "First name must be at least 2 characters"
      ),
      lastName: hasLength(
        { min: 2 },
        "Last name must be at least 2 characters"
      ),
      email: isEmail("Invalid email") || isNotEmpty("Email is required"),
      password: hasLength({ min: 8 }, "Password must be at least 8 characters"),

      confirmPassword: matchesField("password", "Passwords do not match"),
    },
  });

  return (
    <>
      <Head>
        <title>Create an account | eBoto Mo</title>
      </Head>

      <Container size={420} my={40}>
        <Title align="center" order={2}>
          Create an account!
        </Title>
        <Text color="dimmed" size="sm" align="center" mt={5}>
          Already have an account?{" "}
          <Anchor size="sm" component={Link} href="/signin" truncate>
            Sign in
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
          <form
            onSubmit={form.onSubmit((values) => {
              void (async () => {
                await signUpMutation.mutateAsync({
                  email: values.email,
                  password: values.password,
                  first_name: values.firstName,
                  last_name: values.lastName,
                });
                form.reset();
              })();
            })}
          >
            <Stack spacing="sm">
              <Group grow>
                <TextInput
                  placeholder="Enter your first name"
                  withAsterisk
                  label="First name"
                  required
                  {...form.getInputProps("firstName")}
                  icon={<IconLetterCase size="1rem" />}
                  disabled={signUpMutation.isLoading}
                />
                <TextInput
                  placeholder="Enter your last name"
                  withAsterisk
                  label="Last name"
                  {...form.getInputProps("lastName")}
                  disabled={signUpMutation.isLoading}
                  icon={<IconLetterCase size="1rem" />}
                />
              </Group>

              <TextInput
                placeholder="Enter your email address"
                type="email"
                withAsterisk
                label="Email"
                required
                icon={<IconAt size="1rem" />}
                disabled={signUpMutation.isLoading}
                {...form.getInputProps("email")}
              />

              <PasswordInput
                placeholder="Enter your password"
                withAsterisk
                label="Password"
                required
                visible={visible}
                onVisibilityChange={toggle}
                {...form.getInputProps("password")}
                disabled={signUpMutation.isLoading}
                icon={<IconLock size="1rem" />}
              />
              <PasswordInput
                placeholder="Confirm your password"
                withAsterisk
                label="Confirm password"
                required
                visible={visible}
                onVisibilityChange={toggle}
                {...form.getInputProps("confirmPassword")}
                disabled={signUpMutation.isLoading}
                icon={<IconLock size="1rem" />}
              />

              {signUpMutation.isError && (
                <Alert
                  icon={<IconAlertCircle size="1rem" />}
                  title="Error"
                  color="red"
                >
                  {signUpMutation.error.message}
                </Alert>
              )}

              <Button type="submit" loading={signUpMutation.isLoading}>
                Sign up
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </>
  );
};

export default Signup;

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
