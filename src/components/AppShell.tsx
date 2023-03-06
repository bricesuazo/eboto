import { useState, useEffect } from "react";
import { AppShell } from "@mantine/core";
import Header from "./Header";
import Navbar from "./Navbar";
import { useRouter } from "next/router";

const AppShellComponent = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [opened, setOpened] = useState(false);

  return (
    <AppShell
      padding="md"
      navbar={
        router.pathname.includes("/dashboard") ? (
          <Navbar opened={opened} />
        ) : undefined
      }
      header={
        <Header isNavbarOpen={opened} setIsNavbarOpenOpened={setOpened} />
      }
      // navbarOffsetBreakpoint={
      //   router.pathname.includes("/dashboard") ? "sm" : undefined
      // }
      // styles={(theme) => ({
      //   main: {
      //     backgroundColor:
      //       theme.colorScheme === "dark"
      //         ? theme.colors.dark[8]
      //         : theme.colors.gray[0],
      //   },
      // })}
    >
      {children}
    </AppShell>
  );
};

export default AppShellComponent;
