"use client";

import { AppShell, Aside, Box } from "@mantine/core";
import { usePathname } from "next/navigation";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <AppShell
      padding={0}
      aside={
        pathname.includes("/dashboard/[electionSlug]") ? (
          <Aside
            display="none"
            // width={{ lg: 240, xl: 340 }}
            // hidden
            // hiddenBreakpoint="lg"
          >
            <>Aside</>
          </Aside>
        ) : undefined
      }
      // footer={!pathname.includes("/dashboard") ? <Footer /> : undefined}
    >
      <Box mb="xl" h="100%">
        {children}
      </Box>
    </AppShell>
  );
}
