"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

import { api } from "./client";
import { getUrl } from "./shared";

export default function TRPCProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // defaultOptions: {
        //   queries: {
        //     refetchOnMount: true,
        //     refetchOnWindowFocus: true,
        //     refetchOnReconnect: true,
        //   },
        // },
      }),
  );
  const [trpcClient] = useState(() =>
    api.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: getUrl(),
        }),
      ],
    }),
  );

  return (
    <>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </api.Provider>
    </>
  );
}
