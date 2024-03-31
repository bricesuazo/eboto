import { supabase as supabaseAdmin } from "@/utils/supabase/admin";
import { supabase } from "@/utils/supabase/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@eboto/api";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return createTRPCContext({
        req,
        session,
        supabase: supabaseAdmin,
      });
    },
  });

export { handler as GET, handler as POST };
