import Footer from "@/components/footer";
import Header from "@/components/header";
import { createClient } from "@/utils/supabase/server";
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
} from "@mantine/core";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <AppShell
      padding={0}
      header={{ height: 60 }}
      footer={{ height: 60 }}

      // navbar={{ sm: 240, md: 300, xl: 340 }}
      //  navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
    >
      <AppShellHeader>
        <Header isLoggedIn={!!user} />
      </AppShellHeader>

      <AppShellMain>{children}</AppShellMain>

      <AppShellFooter>
        <Footer />
      </AppShellFooter>
    </AppShell>
  );
}
