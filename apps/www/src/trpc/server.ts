import { cache } from "react";
import { headers } from "next/headers";
import { createHydrationHelpers } from "@trpc/react-query/rsc";

import type { AppRouter } from "@eboto/api";
import { createTRPCContext } from "@eboto/api";
import { createCaller } from "@eboto/api/src/root";

import { createClient as createClientServer } from "~/supabase/server";
import type { Database } from "../../../../supabase/types";
import { createQueryClient } from "./query-client";

const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let user_db: Database["public"]["Tables"]["users"]["Row"] | null = null;

  if (user) {
    const { data } = await supabase
      .from("users")
      .select()
      .eq("id", user.id)
      .single();

    user_db = data;
  }
  return createTRPCContext({
    user:
      user && user_db
        ? {
            db: user_db,
            auth: user,
          }
        : null,
    headers: heads,
  });
});

const getQueryClient = cache(createQueryClient);
const caller = createCaller(createContext);

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);
