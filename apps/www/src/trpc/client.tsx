"use client";

import { useState } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { loggerLink, unstable_httpBatchStreamLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { env } from "env.mjs";
import SuperJSON from "superjson";

import type { AppRouter } from "@eboto/api";

import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient();
  }

  return (clientQueryClientSingleton ??= createQueryClient());
};

export const api = createTRPCReact<AppRouter>();

export type RouterInputs = inferRouterInputs<AppRouter>;

export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        unstable_httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + "/api/trpc",
          headers: () => {
            const headers = new Headers();
            headers.set("x-trpc-source", "nextjs-react");
            return headers;
          },
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}

export const getBaseUrl = () => {
  if (typeof window !== "undefined") return "";

  return env.APP_URL;
  // return `http://localhost:3000`;
};
export function getUrl() {
  return getBaseUrl() + "/api/trpc";
}
