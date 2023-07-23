import DashboardOverview from '@/components/client/pages/dashboard-overview';
import { api_server } from '@/shared/server/trpc';

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await api_server.election.getElectionBySlug.fetch({
    slug: electionDashboardSlug,
  });

  return <DashboardOverview election={election} />;
}
