import DashboardLayout from "@/components/client/layouts/dashboard-layout";
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
  return <DashboardLayout>{children}</DashboardLayout>;
}
