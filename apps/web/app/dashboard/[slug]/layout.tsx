import DashboardElectionLayout from "@/components/client/layouts/dashboard-election-layout";
import { getElectionBySlug } from "@/utils/election";
import { type ResolvingMetadata, type Metadata } from "next";

export async function generateMetadata(
  {
    params,
  }: {
    params: { slug: string };
  },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const election = await getElectionBySlug(params.slug);

  return {
    title: election.name + " - Dashboard",
  };
}

export default async function ElectionDashboardLayout({
  children,
  params: { slug },
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const election = await getElectionBySlug(slug);
  return <DashboardElectionLayout>{children}</DashboardElectionLayout>;
}
