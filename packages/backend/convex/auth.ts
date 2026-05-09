import Google from '@auth/core/providers/google';
import Resend from '@auth/core/providers/resend';
import { convexAuth } from '@convex-dev/auth/server';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google,
    // Magic-link via Resend. Replace with the project's actual mail provider
    // (AWS SES) before launch — Convex Auth ships a Resend provider out of the
    // box, others can be implemented as a custom provider.
    Resend,
  ],
});
