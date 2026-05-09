import { convexQuery } from '@convex-dev/react-query';
import { createFileRoute, notFound, Outlet } from '@tanstack/react-router';
import { ConvexError } from 'convex/values';
import dayjs from 'dayjs';

import { api } from '@eboto/backend/api';

import { PagePending } from '~/components/page-pending';
import {
  CONVEX_ERROR_UNAUTHORIZED,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SITE_URL,
} from '~/lib/constants';

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
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      convexQuery(api.elections.getBySlug, { slug: params.electionSlug }),
    ),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: 'eBoto' }] };
    }
    const { election } = loaderData;
    const dateRange =
      dayjs(election.startDate).format('MMMM D, YYYY') +
      ' - ' +
      dayjs(election.endDate).format('MMMM D, YYYY');
    const ogImageUrl = `${SITE_URL}/api/og?type=election&election_name=${encodeURIComponent(
      election.name,
    )}&election_logo=${encodeURIComponent(
      election.logoUrl ?? '',
    )}&election_date=${encodeURIComponent(dateRange)}`;
    const description = `See details about ${election.name} | eBoto`;
    return {
      meta: [
        { title: `${election.name} | eBoto` },
        { name: 'description', content: description },
        { property: 'og:title', content: election.name },
        { property: 'og:description', content: description },
        { property: 'og:image', content: ogImageUrl },
        { property: 'og:image:width', content: String(OG_IMAGE_WIDTH) },
        { property: 'og:image:height', content: String(OG_IMAGE_HEIGHT) },
        { property: 'og:image:alt', content: election.name },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: election.name },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: ogImageUrl },
      ],
    };
  },
  pendingComponent: PagePending,
  component: ElectionLayout,
});

function ElectionLayout() {
  return <Outlet />;
}
