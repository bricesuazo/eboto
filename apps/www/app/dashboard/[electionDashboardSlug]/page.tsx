import DashboardOverview from "@/components/client/pages/dashboard-overview";
import { getElectionBySlug } from "@/utils/election";

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await getElectionBySlug(electionDashboardSlug);

  return <DashboardOverview election={election} />;
}
