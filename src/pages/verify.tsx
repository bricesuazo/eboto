import {
  Stack,
  Input,
  Alert,
  Button,
  Container,
  Center,
  Loader,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRouter } from "next/router";
import { api } from "../utils/api";

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
      token: token as string,
      type: type as "EMAIL_VERIFICATION" | "PASSWORD_RESET",
    },
    {
      enabled: router.isReady,
    }
  );
  const resetPasswordMutation = api.user.resetPassword.useMutation();

  if (verify.isLoading) {
    return (
      <Center h="100%">
        <Loader size="lg" />
      </Center>
    );
  }

  if (verify.isError) {
    return (
      <div>
        <h1>Error</h1>
        <p>{verify.error.message}</p>
      </div>
    );
  }

  if (!verify.data || verify.data.length === 0) {
    return (
      <div>
        <h1>Error</h1>
        <p>Token not found</p>
      </div>
    );
  }

  switch (verify.data) {
    case "EMAIL_VERIFICATION":
      return (
        <div>
          <h1>Success! </h1>
          <p>Your account has been verified. Please sign in.</p>
        </div>
      );
    case "PASSWORD_RESET":
      if (resetPasswordMutation.isSuccess) {
        return (
          <div>
            <h1>Success! </h1>
            <p>Your password has been reset. Please sign in.</p>
          </div>
        );
      } else {
        return (
          <Container>
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
          </Container>
        );
      }
  }
};

export default VerifyPage;
