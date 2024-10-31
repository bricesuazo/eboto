import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DashboardVoter from "~/components/pages/dashboard-voter";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Voters",
};

export default async function Page({
  params,
}: {
  params: Promise<{ electionDashboardSlug: string }>;
}) {
  const { electionDashboardSlug } = await params;
  const data = await api.election
    .getVotersByElectionSlug({
      election_slug: electionDashboardSlug,
    })
    .catch(() => notFound());

  return <DashboardVoter data={data} />;
}
