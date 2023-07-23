import DashboardOverview from '@/components/client/pages/dashboard-overview';
import { api_server } from '@/shared/server/trpc';
import { notFound } from 'next/navigation';

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await api_server.election.getElectionBySlug.fetch({
    slug: electionDashboardSlug,
  });

  if (!election) notFound();

  return <DashboardOverview election={election} />;
}
