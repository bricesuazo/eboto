import Footer from "@/components/client/components/footer";
import HeaderContent from "@/components/client/components/header";
import { currentUser } from "@clerk/nextjs";
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
} from "@mantine/core";

export default async function DashboardLayout(props: React.PropsWithChildren) {
  const user = await currentUser();
  return (
    <AppShell header={{ height: 60 }} footer={{ height: 52 }}>
      <AppShellHeader>
        <HeaderContent user={user} />
      </AppShellHeader>

      <AppShellMain>{props.children}</AppShellMain>
      <AppShellFooter>
        <Footer />
      </AppShellFooter>
    </AppShell>
  );
}
