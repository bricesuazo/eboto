import DashboardPosition from "@/components/client/pages/dashboard-position";
import { db } from "@eboto-mo/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Positions",
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

  // const positions = await electionCaller.getAllPositionsByElectionId({
  //   election_id: election.id,
  // });
  const positions = await db.query.positions.findMany({
    where: (positions, { eq }) => eq(positions.election_id, election.id),
    orderBy: (positions, { asc }) => asc(positions.order),
  });
  return <DashboardPosition election={election} positions={positions} />;
}
