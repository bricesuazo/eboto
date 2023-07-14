import { Button, Container, Group } from "@mantine/core";
import { getServerSession } from "next-auth";
import Link from "next/link";
import SignoutButton from "@/components/signout-button";

export default async function Header() {
  const session = await getServerSession();
  console.log("🚀 ~ file: header.tsx:7 ~ Header ~ session:", session);

  return (
    <main>
      <Container size="sm">
        <Group justify="space-between">
          <Button type="submit" component={Link} href="/">
            Home
          </Button>
          {session ? (
            <SignoutButton />
          ) : (
            <Button type="submit" component={Link} href="/dashboard">
              Dashboard
            </Button>
          )}
        </Group>
      </Container>
    </main>
  );
}
