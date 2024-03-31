import { createClient as createClientAdmin } from "@/utils/supabase/admin";
import { createClient as createClientServer } from "@/utils/supabase/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@eboto/api";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const supabaseServer = createClientServer();
      const {
        data: { session },
      } = await supabaseServer.auth.getSession();

      const supabaseAdmin = createClientAdmin();
      return createTRPCContext({
        req,
        session,
        supabase: supabaseAdmin,
      });
    },
  });

export { handler as GET, handler as POST };
