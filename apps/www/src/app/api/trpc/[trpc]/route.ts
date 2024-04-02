import { createClient as createClientAdmin } from "@/utils/supabase/admin";
import { createClient as createClientServer } from "@/utils/supabase/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@eboto/api";

import type { Database } from "../../../../../../../supabase/types";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const supabaseServer = createClientServer();
      const {
        data: { user },
      } = await supabaseServer.auth.getUser();

      let user_db: Database["public"]["Tables"]["users"]["Row"] | null = null;

      if (user) {
        const { data } = await supabaseServer
          .from("users")
          .select()
          .eq("id", user.id)
          .single();

        user_db = data;
      }

      return createTRPCContext({
        req,
        user:
          user && user_db
            ? {
                db: user_db,
                auth: user,
              }
            : null,
        supabase: createClientAdmin(),
      });
    },
  });

export { handler as GET, handler as POST };
