"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SPOTLIGHT_DATA } from "@/config/site";
import { rem } from "@mantine/core";
import { Spotlight } from "@mantine/spotlight";
import { IconSearch } from "@tabler/icons-react";
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
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient({}));
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

  const actions = SPOTLIGHT_DATA.map((action) => ({
    ...action,
    onClick: () => router.push(action.link),
  }));
  return (
    <>
      <Spotlight
        shortcut={["mod + K", "mod + P", "/"]}
        actions={actions}
        nothingFound="Nothing found..."
        highlightQuery
        searchProps={{
          leftSection: (
            <IconSearch
              style={{ width: rem(20), height: rem(20) }}
              stroke={1.5}
            />
          ),
          placeholder: "Search...",
        }}
      />
      <api.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </api.Provider>
    </>
  );
}
