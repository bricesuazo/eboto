import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
} from "@mantine/core";

import Footer from "../footer";
import Header from "../header";

export default async function Dashboard(props: React.PropsWithChildren) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  return (
    <AppShell header={{ height: 60 }} footer={{ height: 52 }}>
      <AppShellHeader>
        <Header userId={user.id} />
      </AppShellHeader>

      <AppShellMain>{props.children}</AppShellMain>
      <AppShellFooter>
        <Footer />
      </AppShellFooter>
    </AppShell>
  );
}
