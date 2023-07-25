import DashboardPartylist from "@/components/client/pages/dashboard-partylist";
import { db } from "@eboto-mo/db";
import { not } from "drizzle-orm";
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
  // const election = await electionCaller.getElectionBySlug({
  //   slug: electionDashboardSlug,
  // });
  const election = await db.query.elections.findFirst({
    where: (elections, { eq }) => eq(elections.slug, electionDashboardSlug),
  });

  if (!election) notFound();

  // const partylists =
  //   await electionCaller.getAllPartylistsWithoutINDByElectionId({
  //     election_id: election.id,
  //   });
  const partylists = await db.query.partylists.findMany({
    where: (partylists, { eq, and }) =>
      and(
        eq(partylists.election_id, election.id),
        not(eq(partylists.acronym, "IND")),
      ),
    orderBy: (partylists, { desc }) => desc(partylists.updated_at),
  });
  return <DashboardPartylist election={election} partylists={partylists} />;
}
