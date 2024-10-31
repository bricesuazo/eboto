import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets";
import { z } from "zod";

export const env = createEnv({
  extends: [vercel()],
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    PORT: z.coerce.number().default(3000),
  },
  server: {
    APP_URL: z.string().url(),

    DISCORD_WEBHOOK_URL: z.string().min(1),

    LEMONSQUEEZY_WEBHOOK_SECRET: z.string().min(1),
    LEMONSQUEEZY_STORE_ID: z.coerce.number().min(1),
    LEMONSQUEEZY_API_KEY: z.string().min(1),
    LEMONSQUEEZY_FREE_VARIANT_ID: z.coerce.number().min(1),
    LEMONSQUEEZY_BOOST_PRODUCT_ID: z.coerce.number().min(1),
    LEMONSQUEEZY_PLUS_VARIANT_ID: z.coerce.number().min(1),
  },

  experimental__runtimeEnv: {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
  },
});
