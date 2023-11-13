import { notFound } from "next/navigation";
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
} from "@mantine/core";

import { auth } from "@eboto/auth";

import Footer from "../components/footer";
import Header from "../components/header";

export default async function Dashboard(props: React.PropsWithChildren) {
  const session = await auth();

  if (!session) notFound();

  return (
    <AppShell header={{ height: 60 }} footer={{ height: 52 }}>
      <AppShellHeader>
        <Header userId={session.user.id} />
      </AppShellHeader>

      <AppShellMain>{props.children} </AppShellMain>
      <AppShellFooter>
        <Footer />
      </AppShellFooter>
    </AppShell>
  );
}
