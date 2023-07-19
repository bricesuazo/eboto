import DashboardCandidate from "@/components/client/pages/dashboard-candidate";
import {
  getAllCandidatesByElectionId,
  getElectionBySlug,
} from "@/utils/election";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Candidates",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await getElectionBySlug(electionDashboardSlug);
  const positionsWithCandidates = await getAllCandidatesByElectionId(
    election.id
  );
  return (
    <DashboardCandidate
      election={election}
      positionsWithCandidates={positionsWithCandidates}
    />
  );
}
