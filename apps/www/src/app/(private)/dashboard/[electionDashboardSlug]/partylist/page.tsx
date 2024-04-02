import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DashboardPartylist from "@/components/pages/dashboard-partylist";
import { api } from "@/trpc/server";
import { createClient } from "@/utils/supabase/admin";

export const metadata: Metadata = {
  title: "Partylists",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const supabase = createClient();
  const { data: election } = await supabase
    .from("elections")
    .select()
    .eq("slug", electionDashboardSlug)
    .is("deleted_at", null)
    .single();

  if (!election) notFound();

  const partylists = await api.partylist.getDashboardData.query({
    election_id: election.id,
  });

  return <DashboardPartylist election={election} partylists={partylists} />;
}
