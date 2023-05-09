import {
  Stack,
  Input,
  Alert,
  Button,
  Container,
  Center,
  Loader,
  Title,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRouter } from "next/router";
import { api } from "../utils/api";
import Link from "next/link";

const VerifyPage = () => {
  const router = useRouter();
  const { token, type } = router.query;

  const form = useForm({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const verify = api.token.verify.useQuery(
    {
      token: token as string | undefined,
      type: type as "EMAIL_VERIFICATION" | "PASSWORD_RESET" | undefined,
    },
    {
      enabled: router.isReady,
    }
  );
  const resetPasswordMutation = api.user.resetPassword.useMutation();

  return (
    <Container h="100%">
      <Stack align="center" h="100%" my="xl">
        {verify.isLoading ? (
          <Center h="100%">
            <Loader size="lg" />
          </Center>
        ) : verify.isError ? (
          <>
            <Title>Error</Title>
            <Text>{verify.error.message}</Text>
          </>
        ) : !verify.data || verify.data.length === 0 ? (
          <>
            <Title>Error</Title>
            <Text>Token not found</Text>
          </>
        ) : verify.data === "EMAIL_VERIFICATION" ? (
          <>
            <Title>Success!</Title>
            <Text>Your account has been verified. Please sign in.</Text>
            <Button component={Link} href="/signin">
              Sign in
            </Button>
          </>
        ) : verify.data === "PASSWORD_RESET" &&
          resetPasswordMutation.isSuccess ? (
          <>
            <Title>Success!</Title>
            <Text>Your password has been reset. Please sign in.</Text>
          </>
        ) : (
          <form
            onSubmit={form.onSubmit((value) => {
              resetPasswordMutation.mutate({
                token: token as string,
                password: value.password,
              });
            })}
          >
            <Stack spacing={4}>
              <Input
                placeholder="Enter your password"
                type="password"
                {...form.getInputProps("password")}
              />

              <Input
                placeholder="Confirm your password"
                type="password"
                {...form.getInputProps("confirmPassword")}
              />

              {resetPasswordMutation.isError && (
                <Alert title="Error" color="red">
                  {resetPasswordMutation.error.message}
                </Alert>
              )}

              <Button type="submit" loading={resetPasswordMutation.isLoading}>
                Sign in
              </Button>
            </Stack>
          </form>
        )}
      </Stack>
    </Container>
  );
};

export default VerifyPage;
