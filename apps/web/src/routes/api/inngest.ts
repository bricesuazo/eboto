import { createFileRoute } from '@tanstack/react-router';
import { serve } from 'inngest/edge';

import { functions, inngest } from '~/server/inngest';

const handler = serve({ client: inngest, functions });

export const Route = createFileRoute('/api/inngest')({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
      POST: ({ request }) => handler(request),
      PUT: ({ request }) => handler(request),
    },
  },
});
