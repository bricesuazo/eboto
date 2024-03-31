import { env } from "env.mjs";

import { createClient as createClientServer } from "./server";

export function createClient() {
  return createClientServer(env.SUPABASE_SERVICE_ROLE_KEY);
}
