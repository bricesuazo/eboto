import { Inngest } from 'inngest';

export const inngest = new Inngest({ id: 'eboto' });

// Functions run via the TanStack Start server route
// `apps/web/src/routes/api/inngest.ts`. Empty for now —
// election-start / election-end land here once their bodies are ported
// from the legacy Supabase-backed implementations.
export const functions: ReturnType<typeof inngest.createFunction>[] = [];
