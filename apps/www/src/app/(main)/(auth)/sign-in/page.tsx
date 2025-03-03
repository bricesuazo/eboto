import type { Metadata } from "next";
import Link from "next/link";
import { Anchor, Text, Title } from "@mantine/core";

import SigninForm from "~/components/signin-form";

export const metadata: Metadata = {
  title: "Sign in to your account",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
  }>;
}) {
  const { next } = await searchParams;

  return (
    <>
      <Title ta="center" order={2}>
        Welcome back!
      </Title>

      <Text c="dimmed" size="sm" ta="center" mt={5} mb={30}>
        Don&apos;t have an account yet?{" "}
        <Anchor
          size="sm"
          component={Link}
          href={"/register" + (next ? `?next=${next}` : "")}
          truncate
        >
          Create account
        </Anchor>
      </Text>

      <SigninForm />
    </>
  );
}
