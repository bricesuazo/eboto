import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    LEMONSQUEEZY_API_KEY: z.string().min(1),
  },
  client: {},
  runtimeEnv: {
    LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
