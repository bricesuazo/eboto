import { Anchor, Button, Container, Group } from "@mantine/core";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { SignoutButton, SigninButton } from "@/components/auth-button";

export default async function Header() {
  const session = await getServerSession();
  console.log("🚀 ~ file: header.tsx:7 ~ Header ~ session:", session);

  return (
    <main>
      <Container size="sm" p="md">
        <Group justify="space-between">
          <Anchor type="submit" variant="link" component={Link} href="/">
            eBoto Mo
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
