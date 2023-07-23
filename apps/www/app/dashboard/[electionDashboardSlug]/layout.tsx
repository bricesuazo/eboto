import DashboardLayout from '@/components/client/layouts/dashboard-layout';
import { siteConfig } from '@/config/site';
import { api_server } from '@/shared/server/trpc';
import { type Metadata, type ResolvingMetadata } from 'next';

export async function generateMetadata(
  {
    params,
  }: {
    params: { electionDashboardSlug: string };
  },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const election = await api_server.election.getElectionBySlug.fetch({
    slug: params.electionDashboardSlug,
  });

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
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
