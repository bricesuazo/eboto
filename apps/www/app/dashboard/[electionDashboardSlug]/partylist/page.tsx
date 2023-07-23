import DashboardPartylist from '@/components/client/pages/dashboard-partylist';
import { api_server } from '@/shared/server/trpc';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Partylists',
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await api_server.election.getElectionBySlug.fetch({
    slug: electionDashboardSlug,
  });

  if (!election) notFound();

  const partylists =
    await api_server.election.getAllPartylistsWithoutINDByElectionId.fetch({
      election_id: election.id,
    });
  return <DashboardPartylist election={election} partylists={partylists} />;
}
