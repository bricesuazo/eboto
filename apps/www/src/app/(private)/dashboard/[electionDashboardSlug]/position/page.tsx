import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DashboardPosition from "@/components/pages/dashboard-position";
import { api } from "@/trpc/server";
import { createClient } from "@/utils/supabase/admin";

export const metadata: Metadata = {
  title: "Positions",
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

  const positions = await api.position.getDashboardData.query({
    election_id: election.id,
  });

  return <DashboardPosition positions={positions} election={election} />;
}
