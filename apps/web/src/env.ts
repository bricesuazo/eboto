import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

/**
 * Validated, typed access to environment variables.
 *
 * - All `VITE_*` vars are exposed to the browser. They're inlined into the
 *   client bundle by Vite at build time.
 * - `runtimeEnv` is `import.meta.env` so the same module works in both the
 *   client bundle (build-time replacement) and the SSR bundle (Vite-injected
 *   in dev, build-time-replaced in prod).
 * - `MODE` is provided by Vite itself ("development" / "production" / etc.).
 */
export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_CONVEX_URL: z.url(),
    VITE_MICROSOFT_CLARITY_ID: z.string(),
    VITE_GOOGLE_ANALYTICS_TRACKING_ID: z.string(),
    VITE_RECAPTCHA_SITE_KEY: z.string(),
  },
  server: {
    DISCORD_WEBHOOK_URL: z.url(),
    RECAPTCHA_SECRET_KEY: z.string(),
  },
  shared: {
    MODE: z.enum(['development', 'test', 'production']).default('development'),
  },
  runtimeEnv: { ...import.meta.env, ...process.env },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === 'true',
});
