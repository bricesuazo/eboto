import DashboardSettings from '@/components/client/pages/dashboard-settings';
import { getElectionBySlug } from '@/utils/election';
import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await getElectionBySlug(electionDashboardSlug);
  return <DashboardSettings election={election} />;
}
