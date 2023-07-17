"use client";

import { Stack } from "@mantine/core";

export default function DashboardElectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Stack p="md">{children}</Stack>;
}
