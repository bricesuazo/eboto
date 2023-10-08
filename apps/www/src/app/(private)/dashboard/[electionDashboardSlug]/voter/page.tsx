import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DashboardVoter from "@/components/client/pages/dashboard-voter";
import { api } from "@/trpc/server";

import { db } from "@eboto-mo/db";

export const metadata: Metadata = {
  title: "Voters",
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
    with: {
      voter_fields: true,
    },
  });

  if (!election) notFound();

  const voters = await api.election.getVotersByElectionId.query({
    election_id: election.id,
  });

  return <DashboardVoter election={election} voters={voters} data-superjson />;
}
