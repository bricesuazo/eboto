import DashboardLayout from '@/components/client/layouts/dashboard-layout';
import { siteConfig } from '@/config/site';
import { getElectionBySlug } from '@/utils/election';
import { type Metadata, type ResolvingMetadata } from 'next';

export async function generateMetadata(
  {
    params,
  }: {
    params: { electionDashboardSlug: string };
  },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const election = await getElectionBySlug(params.electionDashboardSlug);

  return {
    title: {
      default:
        'Overview - ' + election.name + ' - Dashboard | ' + siteConfig.name,
      template: '%s - ' + election.name + ' - Dashboard | ' + siteConfig.name,
    },
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
