import { useState } from "react";
import { AppShell, Aside } from "@mantine/core";
import Header from "./Header";
import Navbar from "./Navbar";
import { useRouter } from "next/router";

const AppShellComponent = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [opened, setOpened] = useState(false);

  return (
    <AppShell
      // padding="xl"
      navbar={
        router.pathname.includes("/dashboard/[electionSlug]") ? (
          <Navbar opened={opened} />
        ) : undefined
      }
      header={
        <Header isNavbarOpen={opened} setIsNavbarOpenOpened={setOpened} />
      }
      aside={
        router.pathname.includes("/dashboard/[electionSlug]") ? (
          <Aside sx={{ display: "none" }}>
            <></>
          </Aside>
        ) : undefined
      }
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
