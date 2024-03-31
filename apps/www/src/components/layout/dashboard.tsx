import { notFound } from "next/navigation";
import { supabase } from "@/utils/supabase/server";
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
} from "@mantine/core";

import Footer from "../footer";
import Header from "../header";

export default async function Dashboard(props: React.PropsWithChildren) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) notFound();

  return (
    <AppShell header={{ height: 60 }} footer={{ height: 52 }}>
      <AppShellHeader>
        <Header userId={session.user.id} />
      </AppShellHeader>

      <AppShellMain>{props.children}</AppShellMain>
      <AppShellFooter>
        <Footer />
      </AppShellFooter>
    </AppShell>
  );
}
