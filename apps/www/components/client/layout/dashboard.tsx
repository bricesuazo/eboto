import { auth } from "@clerk/nextjs";
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
} from "@mantine/core";

import Footer from "../components/footer";
import Header from "../components/header";

export default function Dashboard(props: React.PropsWithChildren) {
  const { userId } = auth();
  return (
    <AppShell header={{ height: 60 }} footer={{ height: 52 }} pb={120}>
      <AppShellHeader>
        <Header userId={userId} />
      </AppShellHeader>

      <AppShellMain>{props.children} </AppShellMain>
      <AppShellFooter>
        <Footer />
      </AppShellFooter>
    </AppShell>
  );
}
