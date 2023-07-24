import DashboardPartylist from "@/components/client/pages/dashboard-partylist";
import { authOptions } from "@/lib/auth";
import { electionRouter } from "@/server/api/routers/election";
import { db } from "@eboto-mo/db";
import { type Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Partylists",
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

  const partylists = await caller.getAllPartylistsWithoutINDByElectionId({
    election_id: election.id,
  });
  return <DashboardPartylist election={election} partylists={partylists} />;
}
