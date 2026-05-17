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
    VITE_POSTHOG_KEY: z.string().min(1).optional(),
    VITE_POSTHOG_HOST: z.url().optional(),
    VITE_SENTRY_DSN: z.url().optional(),
  },
  server: {
    DISCORD_WEBHOOK_URL: z.url(),
  },
  shared: {
    MODE: z.enum(['development', 'test', 'production']).default('development'),
  },
  runtimeEnv: { ...import.meta.env, ...process.env },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === 'true',
});
