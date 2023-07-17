import DashboardOverview from "@/components/client/pages/dashboard-overview";
import { getElectionBySlug } from "@/utils/election";

export default async function Page({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const election = await getElectionBySlug(slug);
  return <DashboardOverview election={election} />;
}
