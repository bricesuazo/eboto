import type { Metadata } from "next";

import DashboardOverview from "~/components/pages/dashboard-overview";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function Page({
  params,
}: {
  params: Promise<{ electionDashboardSlug: string }>;
}) {
  const { electionDashboardSlug } = await params;

  const election = await api.election.getDashboardOverviewData({
    election_slug: electionDashboardSlug,
  });

  return (
    <DashboardOverview data={election} election_slug={electionDashboardSlug} />
  );
}
