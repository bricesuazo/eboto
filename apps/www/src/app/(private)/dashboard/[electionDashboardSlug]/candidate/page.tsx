import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DashboardCandidate from "~/components/pages/dashboard-candidate";
import { createClient } from "~/supabase/admin";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Candidates",
};

export default async function Page({
  params,
}: {
  params: Promise<{ electionDashboardSlug: string }>;
}) {
  const { electionDashboardSlug } = await params;

  const supabase = createClient();
  const { data: election } = await supabase
    .from("elections")
    .select()
    .eq("slug", electionDashboardSlug)
    .is("deleted_at", null)
    .single();

  if (!election) notFound();

  const positionsWithCandidates = await api.candidate.getDashboardData({
    election_id: election.id,
  });

  return (
    <DashboardCandidate
      election={election}
      positionsWithCandidates={positionsWithCandidates}
    />
  );
}
