import Footer from "@/components/client/components/footer";
import Header from "@/components/client/components/header";
import { auth } from "@clerk/nextjs";
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
} from "@mantine/core";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = auth();
  return (
    <AppShell
      padding={0}
      header={{ height: 60 }}
      footer={{ height: 60 }}

      // navbar={{ sm: 240, md: 300, xl: 340 }}
      //  navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
    >
      <AppShellHeader>
        <Header userId={userId} />
      </AppShellHeader>

      <AppShellMain>{children}</AppShellMain>

      <AppShellFooter>
        <Footer />
      </AppShellFooter>
    </AppShell>
  );
}
