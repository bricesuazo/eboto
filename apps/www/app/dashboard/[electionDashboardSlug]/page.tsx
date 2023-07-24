import DashboardOverview from "@/components/client/pages/dashboard-overview";
import { api } from "@/lib/api/api";
import { authOptions } from "@/lib/auth";
import { electionRouter } from "@/server/api/routers/election";
import { db } from "@eboto-mo/db";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

export default async function Page({
  params: { electionDashboardSlug },
}: {
  params: { electionDashboardSlug: string };
}) {
  const caller = electionRouter.createCaller({
    db,
    session: await getServerSession(authOptions),
  });
  const election = await caller.getElectionBySlug({
    slug: electionDashboardSlug,
  });

  if (!election) notFound();

  return <DashboardOverview election={election} />;
}
