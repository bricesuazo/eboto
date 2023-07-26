import SigninForm from "@/components/client/components/signin-form";
import { Anchor, Text, Title } from "@mantine/core";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in to your account",
};

export default function SignInPage() {
  return (
    <>
      <Title ta="center" order={2}>
        Welcome back!
      </Title>
      <Text size="sm" ta="center" mt={5}>
        Don&apos;t have an account yet?{" "}
        <Anchor size="sm" component={Link} href="/signup" truncate>
          Create account
        </Anchor>
      </Text>

      <SigninForm />
    </>
  );
}
