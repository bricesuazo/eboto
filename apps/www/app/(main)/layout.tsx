import Footer from "@/components/client/components/footer";
import HeaderContent from "@/components/client/components/header";
import { currentUser } from "@clerk/nextjs";
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
} from "@mantine/core";

export const runtime =
  process.env.NODE_ENV !== "development" ? "edge" : undefined;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  return (
    <AppShell
      padding={0}
      header={{ height: 60 }}
      footer={{ height: 60 }}
      // navbar={{ sm: 240, md: 300, xl: 340 }}
      //  navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
    >
      <AppShellHeader>
        <HeaderContent user={user} />
      </AppShellHeader>

      <AppShellMain>{children}</AppShellMain>

      <AppShellFooter>
        <Footer />
      </AppShellFooter>
    </AppShell>
  );
}
