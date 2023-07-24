import DashboardLayout from "@/components/client/layouts/dashboard-layout";
import { siteConfig } from "@/config/site";
import { getSession } from "@/lib/session";
import { db } from "@eboto-mo/db";
import { type Metadata, type ResolvingMetadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata(
  {
    params,
  }: {
    params: { electionDashboardSlug: string };
  },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const session = await getSession();

  if (!session) notFound();
  // const election = await electionCaller.getElectionBySlug({
  //   slug: params.electionDashboardSlug,
  // });

  const election = await db.query.elections.findFirst({
    where: (elections, { eq }) =>
      eq(elections.slug, params.electionDashboardSlug),
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
