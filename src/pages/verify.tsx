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
      token: token as string,
      type: type as "EMAIL_VERIFICATION" | "PASSWORD_RESET",
    },
    {
      enabled: router.isReady,
    }
  );
  const resetPasswordMutation = api.user.resetPassword.useMutation();

  return (

    {
      verify.isLoading ?
        (<Center h="100%">
          <Loader size="lg" />
        </Center>)
        : verify.isError ?
          (<Stack>
            <Title>Error</Title>
            <Text>{verify.error.message}</Text>
          </Stack>)
          :
          verify.data || verify.data.length === 0 &&

          (<Stack>
            <Title>Error</Title>
            <Text>Token not found</Text>
          </Stack>)
    }

 
      <Container>
        {
          verify.data === "EMAIL_VERIFICATION" &&
 (       <Stack>
          <Title>Success!</Title>
          <Text>Your account has been verified. Please sign in.</Text>
          <Button component={Link} href="/signin">
            Sign in
          </Button>
        </Stack>)
        }
          {   verify.data ===  "PASSWORD_RESET"&& resetPasswordMutation.isSuccess ? (
            <Stack>
              <Title>Success!</Title>
              <Text>Your password has been reset. Please sign in.</Text>
            </Stack>
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
        </Container>

  
  );
  
};

export default VerifyPage;
