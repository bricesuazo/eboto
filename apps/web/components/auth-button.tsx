"use client";

import { Button } from "@mantine/core";
import { signIn, signOut } from "next-auth/react";

export function SignoutButton() {
  return (
    <Button onClick={() => signOut({ callbackUrl: "/" })} variant="light">
      Sign out
    </Button>
  );
}
export function SigninButton() {
  return <Button onClick={() => signIn()}>Sign in</Button>;
}
