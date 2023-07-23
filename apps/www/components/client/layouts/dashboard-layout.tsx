"use client";

import { Box } from "@mantine/core";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Box p="md">{children}</Box>;
}
