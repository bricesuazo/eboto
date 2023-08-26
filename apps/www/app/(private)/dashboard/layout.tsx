import Footer from "@/components/client/components/footer";
import Header from "@/components/client/components/header";
import { auth } from "@clerk/nextjs";
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
} from "@mantine/core";

export default function DashboardLayout(props: React.PropsWithChildren) {
  const { userId } = auth();

  return (
    <AppShell header={{ height: 60 }} footer={{ height: 52 }}>
      <AppShellHeader>
        <Header userId={userId} />
      </AppShellHeader>

      <AppShellMain>{props.children}</AppShellMain>
      <AppShellFooter>
        <Footer />
      </AppShellFooter>
    </AppShell>
  );
}
