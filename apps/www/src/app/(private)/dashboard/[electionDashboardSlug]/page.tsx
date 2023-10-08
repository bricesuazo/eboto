import type { Metadata } from "next";
import DashboardOverview from "@/components/client/pages/dashboard-overview";
import { api } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await api.election.getDashboardOverviewData.query({
    election_slug: electionDashboardSlug,
  });

  return (
    <DashboardOverview data={election} election_slug={electionDashboardSlug} />
  );
}
