import DashboardPartylist from "@/components/client/pages/dashboard-partylist";
import { electionCallerFunc } from "@/server/api/routers/election";
import { type Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Partylists",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const electionCaller = await electionCallerFunc();
  const election = await electionCaller.getElectionBySlug({
    slug: electionDashboardSlug,
  });

  if (!election) notFound();

  const partylists =
    await electionCaller.getAllPartylistsWithoutINDByElectionId({
      election_id: election.id,
    });
  return <DashboardPartylist election={election} partylists={partylists} />;
}
