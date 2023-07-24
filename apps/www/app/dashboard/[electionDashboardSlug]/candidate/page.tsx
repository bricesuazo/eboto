import DashboardCandidate from "@/components/client/pages/dashboard-candidate";
import { electionCaller } from "@/server/api/routers/election";
import { type Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Candidates",
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

  const positionsWithCandidates =
    await electionCaller.getAllCandidatesByElectionId({
      election_id: election.id,
    });
  const partylists = await electionCaller.getAllPartylistsByElectionId({
    election_id: election.id,
  });
  const positions = await electionCaller.getAllPositionsByElectionId({
    election_id: election.id,
  });

  return (
    <DashboardCandidate
      election={election}
      positionsWithCandidates={positionsWithCandidates}
      partylists={partylists}
      positions={positions}
    />
  );
}
