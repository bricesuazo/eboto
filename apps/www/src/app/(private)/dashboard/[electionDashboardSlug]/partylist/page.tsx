import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DashboardPartylist from "~/components/pages/dashboard-partylist";
import { createClient } from "~/supabase/admin";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Partylists",
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

  const partylists = await api.partylist.getDashboardData({
    election_id: election.id,
  });

  return <DashboardPartylist election={election} partylists={partylists} />;
}
