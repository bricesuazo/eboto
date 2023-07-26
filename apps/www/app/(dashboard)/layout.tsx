import HeaderContent from "@/components/client/components/header";
import { currentUser } from "@clerk/nextjs";
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  Container,
} from "@mantine/core";
import { redirect } from "next/navigation";

export default async function DashboardLayout(props: React.PropsWithChildren) {
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  return (
    <AppShell header={{ height: 60 }}>
      <AppShellHeader>
        <HeaderContent user={user} />
      </AppShellHeader>

      <AppShellMain>
        <Container>{props.children}</Container>
      </AppShellMain>
    </AppShell>
  );
}
