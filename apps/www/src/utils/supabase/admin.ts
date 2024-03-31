import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "env.mjs";

import type { Database } from "./../../../../../supabase/types";

export const createClient = () => {
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );
};
