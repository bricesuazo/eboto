import { notFound } from "next/navigation";
import { api } from "@/trpc/server";
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
} from "@mantine/core";

import Footer from "../footer";
import Header from "../header";

export default async function Dashboard(props: React.PropsWithChildren) {
  const user = await api.auth.getUser.query();

  if (!user) notFound();

  return (
    <AppShell header={{ height: 60 }} footer={{ height: 52 }}>
      <AppShellHeader>
        <Header isLoggedIn={true} />
      </AppShellHeader>

      <AppShellMain>{props.children}</AppShellMain>
      <AppShellFooter>
        <Footer />
      </AppShellFooter>
    </AppShell>
  );
}
