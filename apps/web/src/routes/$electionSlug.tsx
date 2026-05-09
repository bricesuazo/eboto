import { convexQuery } from '@convex-dev/react-query';
import { createFileRoute, notFound, Outlet } from '@tanstack/react-router';
import { ConvexError } from 'convex/values';

import { api } from '@eboto/backend/api';

import { PagePending } from '~/components/page-pending';
import { CONVEX_ERROR_UNAUTHORIZED } from '~/lib/constants';

export const Route = createFileRoute('/$electionSlug')({
  beforeLoad: async ({ context, params }) => {
    try {
      const data = await context.queryClient.ensureQueryData(
        convexQuery(api.elections.getBySlug, { slug: params.electionSlug }),
      );
      if (!data) throw notFound();
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { code?: string };
        if (data.code === CONVEX_ERROR_UNAUTHORIZED) throw notFound();
      }
      throw err;
    }
  },
  pendingComponent: PagePending,
  component: ElectionLayout,
});

function ElectionLayout() {
  return <Outlet />;
}
