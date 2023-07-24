import DashboardVoter from "@/components/client/pages/dashboard-voter";
import { api } from "@/lib/api/api";
import { authOptions } from "@/lib/auth";
import { electionRouter } from "@/server/api/routers/election";
import { db } from "@eboto-mo/db";
import { type Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Voters",
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
  const election = await db.query.elections.findFirst({
    where: (elections, { eq }) => eq(elections.slug, electionDashboardSlug),
    with: {
      voter_fields: true,
    },
  });

  if (!election) notFound();

  const voters = await caller.getVotersByElectionId({
    election_id: election.id,
  });
  return <DashboardVoter election={election} voters={voters} />;
}
