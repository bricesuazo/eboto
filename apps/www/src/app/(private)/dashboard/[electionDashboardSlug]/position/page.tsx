import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DashboardPosition from "@/components/client/pages/dashboard-position";
import { api } from "@/trpc/server";

import { db } from "@eboto-mo/db";

export const metadata: Metadata = {
  title: "Positions",
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
  });

  if (!election) notFound();

  const positions = await api.position.getDashboardData.query({
    election_id: election.id,
  });

  return <DashboardPosition positions={positions} election={election} />;
}
