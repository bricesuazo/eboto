import DashboardPosition from "@/components/client/pages/dashboard-position";
import { electionCaller } from "@/server/api/routers/election";
import { type Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Positions",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await electionCaller.getElectionBySlug({
    slug: electionDashboardSlug,
  });

  if (!election) notFound();

  const positions = await electionCaller.getAllPositionsByElectionId({
    election_id: election.id,
  });
  return <DashboardPosition election={election} positions={positions} />;
}
