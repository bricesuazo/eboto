"use client";

import { Box } from "@mantine/core";
import type { PropsWithChildren } from "react";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return <Box p="md">{children}</Box>;
}
