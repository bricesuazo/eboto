import DashboardCandidate from '@/components/client/pages/dashboard-candidate';
import { api_server } from '@/shared/server/trpc';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Candidates',
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

  const positionsWithCandidates =
    await api_server.election.getAllCandidatesByElectionId.fetch({
      election_id: election.id,
    });
  const partylists =
    await api_server.election.getAllPartylistsByElectionId.fetch({
      election_id: election.id,
    });
  const positions = await api_server.election.getAllPositionsByElectionId.fetch(
    { election_id: election.id },
  );

  return (
    <DashboardCandidate
      election={election}
      positionsWithCandidates={positionsWithCandidates}
      partylists={partylists}
      positions={positions}
    />
  );
}
