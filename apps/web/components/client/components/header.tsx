"use client";

import { Anchor, Button, Container, Group, Text } from "@mantine/core";
import { type Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { SigninButton, SignoutButton } from "./auth-button";

export default function HeaderContent({
  session,
}: {
  session: Session | null;
}) {
  return (
    <Container size="md" p="md">
      <Group position="apart">
        <Anchor variant="link" component={Link} href="/">
          <Group spacing="xs">
            <Image
              src="/images/logo.png"
              alt="eBoto Mo's Logo"
              width={40}
              height={40}
            />
            <Text>eBoto Mo</Text>
          </Group>
        </Anchor>
        {session ? (
          <Group>
            <SignoutButton />
            <Button type="submit" component={Link} href="/dashboard">
              Dashboard
            </Button>
          </Group>
        ) : (
          <SigninButton />
        )}
      </Group>
    </Container>
  );
}
