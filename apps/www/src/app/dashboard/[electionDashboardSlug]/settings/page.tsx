import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DashboardSettings from "@/components/client/pages/dashboard-settings";
import { api } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await api.election.getElectionBySlug.query({
    slug: electionDashboardSlug,
  });

  if (!election) notFound();

  return <DashboardSettings election={election} />;
}
