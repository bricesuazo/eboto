"use client";

import Footer from "@/components/client/components/footer";
import HeaderContent from "@/components/client/components/header";
import { useStore } from "@/store";
import type { User } from "@clerk/nextjs/api";
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
  AppShellNavbar,
} from "@mantine/core";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ElectionDashboard({
  children,
  user,
}: React.PropsWithChildren<{ user: User | null }>) {
  const store = useStore();
  const params = useParams();

  return (
    <AppShell
      header={{ height: 60 }}
      footer={{ height: 52 }}
      navbar={{
        width: { base: 200, sm: 300 },
        breakpoint: "xs",
        collapsed: {
          mobile: !store.dashboardMenu,
          desktop: !params.electionDashboardSlug,
        },
      }}
    >
      <AppShellHeader>
        <HeaderContent user={user} />
      </AppShellHeader>

      <AppShellMain>{children}</AppShellMain>

      <AppShellNavbar>
        <Link href={`/dashboard/${params.electionDashboardSlug?.toString()}`}>
          overview
        </Link>
        <Link
          href={`/dashboard/${params.electionDashboardSlug?.toString()}/partylist`}
        >
          partylist
        </Link>
        <Link
          href={`/dashboard/${params.electionDashboardSlug?.toString()}/candidate`}
        >
          candidate
        </Link>
      </AppShellNavbar>

      <AppShellFooter>
        <Footer />
      </AppShellFooter>
    </AppShell>
  );
}
