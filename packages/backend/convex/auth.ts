import Google from '@auth/core/providers/google';
import { Email } from '@convex-dev/auth/providers/Email';
import { convexAuth } from '@convex-dev/auth/server';
import type { GenericActionCtx, GenericDataModel } from 'convex/server';

import { internal } from './_generated/api';

/**
 * Magic-link provider — SES sending lives in [authEmail.ts](./authEmail.ts)
 * (`"use node"`) because the AWS SDK transitively uses Node's `Buffer`,
 * which doesn't exist in Convex's V8 runtime. We schedule the email send
 * via `ctx.scheduler` instead of calling it inline.
 *
 * `@convex-dev/auth` passes `ctx` as the second argument to
 * `sendVerificationRequest` even though Auth.js's type doesn't expose it
 * (the library uses a `@ts-expect-error` on its side); we cast accordingly.
 */
const SesEmail = Email({
  id: 'ses',
  // Magic-link behavior: skip the default `authorize` check that requires
  // the original `email` to be passed alongside the code at verification
  // time. The link itself proves possession of the inbox.
  authorize: undefined,
  // @ts-expect-error — Auth.js's type only declares one param, but
  // @convex-dev/auth passes `ctx` as the second arg at runtime.
  async sendVerificationRequest(
    { identifier: email, url }: { identifier: string; url: string },
    ctx: GenericActionCtx<GenericDataModel>,
  ) {
    await ctx.scheduler.runAfter(0, internal.authEmail.sendMagicLink, {
      email,
      url,
    });
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google, SesEmail],
});
