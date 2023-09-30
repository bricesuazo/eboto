
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
} from "@mantine/core";

import Footer from "../components/footer";
import Header from "../components/header";

export default function Dashboard(props: React.PropsWithChildren) {
  return (
    <AppShell header={{ height: 60 }} footer={{ height: 52 }}>
      <AppShellHeader>
        <Header />
      </AppShellHeader>

      <AppShellMain>{props.children} </AppShellMain>
      <AppShellFooter>
        <Footer />
      </AppShellFooter>
    </AppShell>
  );
}
