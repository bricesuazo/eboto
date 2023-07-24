import DashboardCandidate from "@/components/client/pages/dashboard-candidate";
import { authOptions } from "@/lib/auth";
import { electionRouter } from "@/server/api/routers/election";
import { db } from "@eboto-mo/db";
import { type Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Candidates",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const caller = electionRouter.createCaller({
    db,
    session: await getServerSession(authOptions),
  });

  const election = await caller.getElectionBySlug({
    slug: electionDashboardSlug,
  });

  if (!election) notFound();

  const positionsWithCandidates = await caller.getAllCandidatesByElectionId({
    election_id: election.id,
  });
  const partylists = await caller.getAllPartylistsByElectionId({
    election_id: election.id,
  });
  const positions = await caller.getAllPositionsByElectionId({
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
