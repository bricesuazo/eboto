import DashboardSettings from "@/components/client/pages/dashboard-settings";
import { db } from "@eboto-mo/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Settings",
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

  return <DashboardSettings election={election} />;
}
