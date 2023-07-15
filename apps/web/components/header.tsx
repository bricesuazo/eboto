import { Anchor, Button, Container, Group, Text } from "@mantine/core";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { SignoutButton, SigninButton } from "@/components/auth-button";
import Image from "next/image";

export default async function Header() {
  const session = await getServerSession();
  console.log("🚀 ~ file: header.tsx:7 ~ Header ~ session:", session);

  return (
    <main>
      <Container size="md" p="md">
        <Group justify="space-between">
          <Anchor variant="link" component={Link} href="/">
            <Group gap="xs">
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
    </main>
  );
}
