import DashboardLayout from "@/components/client/layouts/dashboard-layout";
import { siteConfig } from "@/config/site";
import { authOptions } from "@/lib/auth";
import { electionRouter } from "@/server/api/routers/election";
import { db } from "@eboto-mo/db";
import { type Metadata, type ResolvingMetadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

export async function generateMetadata(
  {
    params,
  }: {
    params: { electionDashboardSlug: string };
  },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const caller = electionRouter.createCaller({
    db,
    session: await getServerSession(authOptions),
  });
  const election = await caller.getElectionBySlug({
    slug: params.electionDashboardSlug,
  });

  if (!election) notFound();

  return {
    title: {
      default:
        "Overview - " + election.name + " - Dashboard | " + siteConfig.name,
      template: "%s - " + election.name + " - Dashboard | " + siteConfig.name,
    },
  };
}

export default async function ElectionDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
