import { useState } from "react";
import { AppShell, Aside, Box } from "@mantine/core";
import Header from "./Header";
import Navbar from "./Navbar";
import { useRouter } from "next/router";
import Footer from "./Footer";

const AppShellComponent = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [opened, setOpened] = useState(false);

  return (
    <AppShell
      padding={router.pathname.includes("/account") ? 0 : "md"}
      navbar={
        router.pathname.includes("/dashboard/[electionSlug]") ? (
          <Navbar opened={opened} setOpened={setOpened} />
        ) : undefined
      }
      header={
        <Header isNavbarOpen={opened} setIsNavbarOpenOpened={setOpened} />
      }
      aside={
        router.pathname.includes("/dashboard/[electionSlug]") ? (
          <Aside
            display="none"
            // width={{ lg: 200, xl: 300 }}
            // hidden
            // hiddenBreakpoint="lg"
          >
            <>Aside</>
          </Aside>
        ) : undefined
      }
      footer={!router.pathname.includes("/dashboard") ? <Footer /> : undefined}
    >
      <Box mb="xl" h="100%">
        {children}
      </Box>
    </AppShell>
  );
};

export default AppShellComponent;
