import DashboardVoter from "@/components/client/pages/dashboard-voter";
import { electionCaller } from "@/server/api/routers/election";
import { db } from "@eboto-mo/db";
import { type Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Voters",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const election = await db.query.elections.findFirst({
    where: (elections, { eq }) => eq(elections.slug, electionDashboardSlug),
    with: {
      voter_fields: true,
    },
  });

  if (!election) notFound();

  const voters = await electionCaller.getVotersByElectionId({
    election_id: election.id,
  });
  return <DashboardVoter election={election} voters={voters} />;
}
