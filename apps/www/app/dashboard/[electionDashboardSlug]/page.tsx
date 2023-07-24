import DashboardOverview from "@/components/client/pages/dashboard-overview";
import { db } from "@eboto-mo/db";
import { notFound } from "next/navigation";

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

  return <DashboardOverview election={election} />;
}
