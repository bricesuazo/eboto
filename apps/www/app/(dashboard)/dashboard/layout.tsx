import Header from "@/components/server/components/header";
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  Container,
} from "@mantine/core";

export default function DashboardLayout(props: React.PropsWithChildren) {
  return (
    <AppShell header={{ height: 60 }}>
      <AppShellHeader>
        <Header />
      </AppShellHeader>

      <AppShellMain>
        <Container size="md" my="md">
          {props.children}
        </Container>
      </AppShellMain>
    </AppShell>
  );
}
