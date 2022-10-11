import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Center,
  Container,
  FormControl,
  FormLabel,
  Input,
  Stack,
} from "@chakra-ui/react";
import type { NextPage } from "next";
import { useState } from "react";
import { useSendPasswordResetEmail } from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebase";

const ForgotPasswordPage: NextPage = () => {
  const [sendPasswordResetEmail, sending, error] =
    useSendPasswordResetEmail(auth);
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  return (
    <Center height="80vh">
      <Container maxW="sm">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSuccess(false);
            await sendPasswordResetEmail(email);
            setSuccess(true);
          }}
          style={{ width: "100%" }}
        >
          <Stack width="100%">
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>

              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isRequired
                disabled={sending}
              />
            </FormControl>
            {success && !error && (
              <Alert status="success">
                <AlertIcon />
                <AlertDescription>
                  Password Sent! Please check your email.
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert status="error">
                <AlertIcon />
                <AlertDescription>{error?.code}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" isLoading={sending}>
              Reset password
            </Button>
          </Stack>
        </form>
      </Container>
      ;
    </Center>
  );
};

export default ForgotPasswordPage;
