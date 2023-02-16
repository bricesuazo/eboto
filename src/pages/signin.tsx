import { type NextPage } from "next";
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
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Head from "next/head";

const Signin: NextPage = () => {
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  return (
    <>
      <Head>
        <title>Sign in to your account | eBoto Mo</title>
      </Head>

      <Container>
        <form
          onSubmit={handleSubmit(async (data) => {
            setError(undefined);
            setLoading(true);

            await signIn("credentials", {
              email: data.email as string,
              password: data.password as string,
              redirect: false,
            }).then((res) => {
              if (res?.error) {
                setError(res.error);

                res.error === "Email not verified. Email verification sent." &&
                  reset();
              } else {
                reset();
              }
            });
            setLoading(false);
          })}
        >
          <Stack spacing={4}>
            <FormControl
              isInvalid={!!errors.email}
              isRequired
              isDisabled={loading}
            >
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
            <FormControl
              isInvalid={!!errors.password}
              isRequired
              isDisabled={loading}
            >
              <FormLabel>Password</FormLabel>
              <Input
                placeholder="Enter your password"
                type="password"
                {...register("password", {
                  required: "This is required.",
                  min: {
                    value: 8,
                    message: "Password must be at least 8 characters.",
                  },
                })}
              />
              {errors.password && (
                <FormErrorMessage>
                  {errors.password.message?.toString()}
                </FormErrorMessage>
              )}
            </FormControl>

            {error && (
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>Sign in error.</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" isLoading={loading}>
              Sign in
            </Button>
          </Stack>
        </form>
      </Container>
    </>
  );
};

export default Signin;
