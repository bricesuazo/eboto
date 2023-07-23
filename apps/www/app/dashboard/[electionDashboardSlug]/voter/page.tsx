import DashboardVoter from '@/components/client/pages/dashboard-voter';
import { api_server } from '@/shared/server/trpc';
import { db } from '@eboto-mo/db';
import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Voters',
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await db.query.elections.findFirst({
    where: (elections, { eq }) => eq(elections.slug, electionDashboardSlug),
    with: {
      voter_fields: true,
    },
  });

  const voters = await api_server.election.getVotersByElectionId.fetch({
    election_id: election.id,
  });
  return <DashboardVoter election={election} voters={voters} />;
}
