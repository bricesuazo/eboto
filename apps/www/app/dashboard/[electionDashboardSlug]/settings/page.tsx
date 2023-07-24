import DashboardSettings from "@/components/client/pages/dashboard-settings";
import { electionCallerFunc } from "@/server/api/routers/election";
import { type Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const electionCaller = await electionCallerFunc();
  const election = await electionCaller.getElectionBySlug({
    slug: electionDashboardSlug,
  });

  if (!election) notFound();

  return <DashboardSettings election={election} />;
}
