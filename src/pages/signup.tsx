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
import { type NextPage } from "next";
import { api } from "../utils/api";
import { useForm } from "react-hook-form";

const Signup: NextPage = () => {
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm();

  const signUpMutation = api.user.signUp.useMutation();

  return (
    <Container>
      <form
        onSubmit={handleSubmit(async (data) => {
          await signUpMutation.mutateAsync({
            email: data.email as string,
            password: data.password as string,
            first_name: data.firstName as string,
            last_name: data.lastName as string,
            middle_name: data.middleName as string,
          });

          reset();
        })}
      >
        <Stack spacing={4}>
          <Stack direction={["column", "row"]} spacing={[4, 2]}>
            <FormControl isInvalid={!!errors.firstName} isRequired>
              <FormLabel>First name</FormLabel>
              <Input
                placeholder="Enter your first name"
                type="text"
                {...register("firstName", {
                  required: "This is required.",
                })}
              />
              {errors.firstName && (
                <FormErrorMessage>
                  {errors.firstName.message?.toString()}
                </FormErrorMessage>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Middle name</FormLabel>
              <Input
                placeholder="Enter your Middle name"
                type="text"
                {...register("middleName")}
              />
              {errors.middleName && (
                <FormErrorMessage>
                  {errors.middleName.message?.toString()}
                </FormErrorMessage>
              )}
            </FormControl>
            <FormControl isInvalid={!!errors.lastName} isRequired>
              <FormLabel>Last name</FormLabel>
              <Input
                placeholder="Enter your last name"
                type="text"
                {...register("lastName", {
                  required: "This is required.",
                })}
              />
              {errors.lastName && (
                <FormErrorMessage>
                  {errors.lastName.message?.toString()}
                </FormErrorMessage>
              )}
            </FormControl>
          </Stack>

          <FormControl isInvalid={!!errors.email} isRequired>
            <FormLabel>Email address</FormLabel>
            <Input
              placeholder="Enter your email address"
              type="email"
              {...register("email", {
                required: "This is required.",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address.",
                },
              })}
            />
            {errors.email && (
              <FormErrorMessage>
                {errors.email.message?.toString()}
              </FormErrorMessage>
            )}
          </FormControl>
          <FormControl isInvalid={!!errors.password} isRequired>
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

          <FormControl isInvalid={!!errors.confirmPassword} isRequired>
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
          </FormControl>

          {signUpMutation.isError && (
            <Alert status="error">
              <AlertIcon />
              <AlertTitle>Sign up error.</AlertTitle>
              <AlertDescription>
                {signUpMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" isLoading={signUpMutation.isLoading}>
            Sign up
          </Button>
        </Stack>
      </form>
    </Container>
  );
};

export default Signup;
