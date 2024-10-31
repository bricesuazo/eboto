import type { NextRequest } from "next/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@eboto/api";
import { createClient as createClientAdmin } from "@eboto/supabase/client/admin";
import { createClient } from "@eboto/supabase/client/server";
import type { Database } from "@eboto/supabase/types";

import { env } from "~/env";

const createContext = async (req: NextRequest) => {
  const supabase = await createClient();
  const supabaseAdmin = createClientAdmin();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let user_db: Database["public"]["Tables"]["users"]["Row"] | null = null;

  if (user) {
    const { data } = await supabaseAdmin
      .from("users")
      .select()
      .eq("id", user.id)
      .single();

    user_db = data;
  }

  return createTRPCContext({
    headers: req.headers,
    user:
      user && user_db
        ? {
            auth: user,
            db: user_db,
          }
        : null,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
