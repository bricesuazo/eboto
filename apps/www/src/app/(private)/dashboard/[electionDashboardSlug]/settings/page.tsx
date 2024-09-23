import type { Metadata } from "next";

import DashboardSettings from "~/components/pages/dashboard-settings";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await api.election.getElectionBySlug({
    election_slug: electionDashboardSlug,
  });

  return <DashboardSettings election={election} />;
}
