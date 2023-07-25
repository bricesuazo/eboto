"use client";

import type { User } from "@clerk/nextjs/api";
import { AppShell } from "@mantine/core";

import HeaderContent from "../../client/components/header";

export default function RootLayoutClient({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  return (
    <AppShell
      padding={0}
      header={{ height: 60 }}
      // navbar={{ sm: 240, md: 300, xl: 340 }}
      //  navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
    >
      <AppShell.Header>
        <HeaderContent user={user} />
      </AppShell.Header>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
