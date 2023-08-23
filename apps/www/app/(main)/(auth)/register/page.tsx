import RegisterForm from "@/components/client/components/register-form";
import { Anchor, Text, Title } from "@mantine/core";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create an account",
};

export default function RegisterPage() {
  return (
    <>
      <Title ta="center" order={2}>
        Create an account!
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5} mb={30}>
        Already have an account?{" "}
        <Anchor size="sm" component={Link} href="/sign-in" truncate>
          Sign in
        </Anchor>
      </Text>

      <RegisterForm />
    </>
  );
}
