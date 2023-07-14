"use client";

import { Button } from "@mantine/core";
import { signOut } from "next-auth/react";

export default function SignoutButton() {
  return <Button onClick={() => signOut()}>Sign out</Button>;
}
