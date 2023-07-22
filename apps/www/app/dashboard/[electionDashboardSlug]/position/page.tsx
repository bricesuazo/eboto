import DashboardPosition from '@/components/client/pages/dashboard-position';
import {
  getAllPositionsByElectionId,
  getElectionBySlug,
} from '@/utils/election';
import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Positions',
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await getElectionBySlug(electionDashboardSlug);
  const positions = await getAllPositionsByElectionId(election.id);
  return <DashboardPosition election={election} positions={positions} />;
}
