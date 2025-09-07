import { env } from 'env';

import ElectionPageClient from '~/components/pages/election-page';
import { api } from '~/trpc/server';

export default async function ElectionPage({
  params,
}: {
  params: Promise<{ electionSlug: string }>;
}) {
  const { electionSlug } = await params;

  const getElectionPage = await api.election.getElectionPage({
    election_slug: electionSlug,
  });

  return (
    <ElectionPageClient
      data={getElectionPage}
      election_slug={electionSlug}
      is_free={
        getElectionPage.election.variant_id ===
          env.LEMONSQUEEZY_FREE_VARIANT_ID &&
        getElectionPage.election.no_of_voters === null
      }
    />
  );
}
