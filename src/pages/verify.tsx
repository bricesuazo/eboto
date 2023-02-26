import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
} from "@chakra-ui/react";
import { Container } from "@react-email/container";
import { useRouter } from "next/router";
import { type SubmitHandler, useForm } from "react-hook-form";
import { api } from "../utils/api";

type FormValues = {
  token: string;
  password: string;
  confirmPassword: string;
};

const VerifyPage = () => {
  const router = useRouter();
  const { token, type } = router.query;
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>();

  const verify = api.token.verify.useQuery(
    {
      token: token as string,
      type: type as "EMAIL_VERIFICATION" | "PASSWORD_RESET",
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      retry: false,
    }
  );
  const resetPasswordMutation = api.user.resetPassword.useMutation();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    await resetPasswordMutation.mutateAsync({
      token: token as string,
      password: data.password,
    });
  };

  if (verify.isLoading) {
    return (
      <div>
        <h1>Loading...</h1>
      </div>
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
      }
      return (
        <Container>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={4}>
              <FormControl
                isInvalid={!!errors.password}
                isRequired
                isDisabled={resetPasswordMutation.isLoading}
              >
                <FormLabel>Password</FormLabel>
                <Input
                  placeholder="Enter your password"
                  type="password"
                  {...register("password", {
                    required: "This is required.",
                    min: {
                      value: 8,
                      message: "Password must be at least 8 characters long.",
                    },
                    validate: (value) =>
                      value === getValues("confirmPassword") ||
                      "The passwords do not match.",
                  })}
                />
                {errors.password && (
                  <FormErrorMessage>
                    {errors.password.message?.toString()}
                  </FormErrorMessage>
                )}
              </FormControl>

              <FormControl
                isInvalid={!!errors.confirmPassword}
                isRequired
                isDisabled={resetPasswordMutation.isLoading}
              >
                <FormLabel>Confirm password</FormLabel>
                <Input
                  placeholder="Confirm your password"
                  type="password"
                  {...register("confirmPassword", {
                    required: "This is required.",
                    min: {
                      value: 8,
                      message: "Password must be at least 8 characters long.",
                    },
                    validate: (value) =>
                      value === getValues("password") ||
                      "The passwords do not match.",
                  })}
                />
                {errors.confirmPassword && (
                  <FormErrorMessage>
                    {errors.confirmPassword.message?.toString()}
                  </FormErrorMessage>
                )}

                {resetPasswordMutation.isError && (
                  <Alert status="error">
                    <AlertIcon />
                    <AlertTitle>Sign in error.</AlertTitle>
                    <AlertDescription>
                      {resetPasswordMutation.error.message}
                    </AlertDescription>
                  </Alert>
                )}
              </FormControl>

              <Button type="submit" isLoading={resetPasswordMutation.isLoading}>
                Sign in
              </Button>
            </Stack>
          </form>
        </Container>
      );
  }
};

export default VerifyPage;
