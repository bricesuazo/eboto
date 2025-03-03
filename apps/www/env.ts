/* eslint-disable no-restricted-properties */
import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod";

export const env = createEnv({
  extends: [vercel()],
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    PORT: z.coerce.number().default(3000),
    NEXT_PUBLIC_SUPABASE_URL: z.string().min(1).url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  server: {
    APP_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    DISCORD_WEBHOOK_URL: z.string().min(1),

    INNGEST_SIGNING_KEY: z.string().min(1),
    INNGEST_EVENT_KEY: z.string().min(1),

    LEMONSQUEEZY_WEBHOOK_SECRET: z.string().min(1),
    LEMONSQUEEZY_STORE_ID: z.number().min(1),
    LEMONSQUEEZY_API_KEY: z.string().min(1),
    LEMONSQUEEZY_FREE_VARIANT_ID: z.number().min(1),
    LEMONSQUEEZY_BOOST_PRODUCT_ID: z.number().min(1),
    LEMONSQUEEZY_PLUS_VARIANT_ID: z.number().min(1),
  },

  client: {
    NEXT_PUBLIC_SENTRY_DSN: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().min(1),
  },

  runtimeEnv: {
    APP_URL: process.env.APP_URL,
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,

    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,

    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,

    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,

    LEMONSQUEEZY_WEBHOOK_SECRET: process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
    LEMONSQUEEZY_STORE_ID: parseInt(process.env.LEMONSQUEEZY_STORE_ID ?? "-1"),
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY,
    LEMONSQUEEZY_FREE_VARIANT_ID: parseInt(
      process.env.LEMONSQUEEZY_FREE_VARIANT_ID ?? "-1",
    ),
    LEMONSQUEEZY_BOOST_PRODUCT_ID: parseInt(
      process.env.LEMONSQUEEZY_BOOST_PRODUCT_ID ?? "-1",
    ),
    LEMONSQUEEZY_PLUS_VARIANT_ID: parseInt(
      process.env.LEMONSQUEEZY_PLUS_VARIANT_ID ?? "-1",
    ),
  },
});
