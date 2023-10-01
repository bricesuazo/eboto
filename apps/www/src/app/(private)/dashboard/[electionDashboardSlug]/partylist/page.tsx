import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DashboardPartylist from "@/components/client/pages/dashboard-partylist";

import { db } from "@eboto-mo/db";

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
    where: (elections, { eq, and, isNull }) =>
      and(
        eq(elections.slug, electionDashboardSlug),
        isNull(elections.deleted_at),
      ),
  });

  if (!election) notFound();

  // const partylists =
  //   await electionCaller.getAllPartylistsWithoutINDByElectionId({
  //     election_id: election.id,
  //   });
  const partylists = await db.query.partylists.findMany({
    where: (partylists, { eq, and, isNull, not }) =>
      and(
        eq(partylists.election_id, election.id),
        not(eq(partylists.acronym, "IND")),
        isNull(partylists.deleted_at),
      ),
    orderBy: (partylists, { desc }) => desc(partylists.updated_at),
  });
  return (
    <DashboardPartylist
      election={election}
      partylists={partylists}
      data-superjson
    />
  );
}
