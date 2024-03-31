import { env } from "env.mjs";

import { createClient } from "./server";

export const dynamic = "force-dynamic";

export const supabase = createClient(env.SUPABASE_SERVICE_ROLE_KEY);
