"use client";

import TRPCProvider from "@/context/trpc-provider";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TRPCProvider>{children}</TRPCProvider>;
}
