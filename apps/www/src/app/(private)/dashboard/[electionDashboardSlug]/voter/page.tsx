import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DashboardVoter from "@/components/pages/dashboard-voter";
import { api } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Voters",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const data = await api.election.getVotersByElectionSlug
    .query({
      election_slug: electionDashboardSlug,
    })
    .catch(() => notFound());

  return <DashboardVoter data={data} />;
}
