import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DashboardCandidate from "@/components/pages/dashboard-candidate";
import { api } from "@/trpc/server";

import { db } from "@eboto/db";

export const metadata: Metadata = {
  title: "Candidates",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await db.query.elections.findFirst({
    where: (election, { eq, and, isNull }) =>
      and(
        eq(election.slug, electionDashboardSlug),
        isNull(election.deleted_at),
      ),
  });

  if (!election) notFound();

  const positionsWithCandidates = await api.candidate.getDashboardData.query({
    election_id: election.id,
  });

  return (
    <DashboardCandidate
      election={election}
      positionsWithCandidates={positionsWithCandidates}
    />
  );
}
