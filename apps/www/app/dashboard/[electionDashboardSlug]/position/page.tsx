import DashboardPosition from '@/components/client/pages/dashboard-position';
import { api_server } from '@/shared/server/trpc';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Positions',
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

  const positions = await api_server.election.getAllPositionsByElectionId.fetch(
    {
      election_id: election.id,
    },
  );
  return <DashboardPosition election={election} positions={positions} />;
}
