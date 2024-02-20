import Footer from "@/components/footer";
import Header from "@/components/header";
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
} from "@mantine/core";

import { auth } from "@eboto/auth";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <AppShell
      padding={0}
      header={{ height: 60 }}
      footer={{ height: 60 }}

      // navbar={{ sm: 240, md: 300, xl: 340 }}
      //  navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
    >
      <AppShellHeader>
        <Header userId={session?.user.id} />
      </AppShellHeader>

      <AppShellMain>{children}</AppShellMain>

      <AppShellFooter>
        <Footer />
      </AppShellFooter>
    </AppShell>
  );
}
