import { createContext } from "@/server/context";
import { appRouter } from "@/server/routers/_app";
import { createTRPCNextLayout } from "@/trpc/@trpc/next-layout";
import superjson from "superjson";

export const api_server = createTRPCNextLayout({
  router: appRouter,
  transformer: superjson,
  createContext() {
    return createContext({
      type: "rsc",
    });
  },
});
