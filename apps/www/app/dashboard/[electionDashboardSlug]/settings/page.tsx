import DashboardSettings from '@/components/client/pages/dashboard-settings';
import { api_server } from '@/shared/server/trpc';
import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await api_server.election.getElectionBySlug.fetch({
    slug: electionDashboardSlug,
  });
  return <DashboardSettings election={election} />;
}
