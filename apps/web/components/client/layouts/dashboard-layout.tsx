"use client";

import { Container } from "@mantine/core";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Container>{children}</Container>;
}
