import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@eboto/api";
import { auth } from "@eboto/auth";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () =>
      createTRPCContext({ req, session: await auth() }),
  });

export { handler as GET, handler as POST };
