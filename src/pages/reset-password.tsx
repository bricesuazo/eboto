import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { api } from "../utils/api";
import { useEffect } from "react";

const ResetPassword = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (router.query.email) {
      setValue("email", router.query.email);
    }
  }, [router.query.email, setValue]);

  const requestResetPasswordMutation =
    api.user.requestResetPassword.useMutation();

  return (
    <Container>
      {requestResetPasswordMutation.isSuccess ? (
        <Alert status="success">
          <AlertIcon />
          <AlertTitle mr={2}>Success!</AlertTitle>
          <AlertDescription>
            Please check your email to reset your password.
          </AlertDescription>
        </Alert>
      ) : (
        <form
          onSubmit={handleSubmit(async (data) => {
            await requestResetPasswordMutation.mutateAsync(
              data.email as string
            );
            reset();
          })}
        >
          <Stack spacing={4}>
            <FormControl
              isInvalid={!!errors.email}
              isRequired
              isDisabled={requestResetPasswordMutation.isLoading}
            >
              <FormLabel>Email</FormLabel>
              <Input
                placeholder="Enter your email"
                type="email"
                {...register("email", {
                  required: "This is required.",
                })}
              />
              {errors.email && (
                <FormErrorMessage>
                  {errors.email.message?.toString()}
                </FormErrorMessage>
              )}
            </FormControl>

            {requestResetPasswordMutation.isError && (
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>Reset password error.</AlertTitle>
                <AlertDescription>
                  {requestResetPasswordMutation.error.message}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              isLoading={requestResetPasswordMutation.isLoading}
            >
              Reset password
            </Button>
          </Stack>
        </form>
      )}
    </Container>
  );
};

export default ResetPassword;
