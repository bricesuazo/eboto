import { AppShell } from "@mantine/core";
import Header from "./Header";
import Navbar from "./Navbar";

const AppShellComponent = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppShell
      padding="md"
      navbar={<Navbar />}
      header={<Header />}
      styles={(theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        },
      })}
    >
      {children}
    </AppShell>
  );
};

export default AppShellComponent;
