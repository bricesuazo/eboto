import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { ExternalLink } from 'lucide-react';

import { api } from '@eboto/backend/api';

import { ChangeLogList } from '~/components/change-log';
import { useVotingStarted } from '~/components/change-reason';
import { DashboardPending } from '~/components/dashboard-pending';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

export const Route = createFileRoute(
  '/dashboard/$electionDashboardSlug/changes',
)({
  beforeLoad: async ({ context, params }) => {
    const election = await context.queryClient.ensureQueryData(
      convexQuery(api.elections.getDashboardBySlug, {
        slug: params.electionDashboardSlug,
      }),
    );
    if (!election) throw notFound();
    await context.queryClient.ensureQueryData(
      convexQuery(api.changeLogs.listForDashboard, {
        electionId: election._id,
      }),
    );
  },
  head: ({ params }) => ({
    meta: [{ title: `${params.electionDashboardSlug} · Change log | eBoto` }],
  }),
  pendingComponent: DashboardPending,
  component: ChangesPage,
});

function ChangesPage() {
  const { electionDashboardSlug } = Route.useParams();
  const { data: election } = useQuery(
    convexQuery(api.elections.getDashboardBySlug, {
      slug: electionDashboardSlug,
    }),
  );
  if (!election) throw notFound();

  const { data: entries = [] } = useQuery(
    convexQuery(api.changeLogs.listForDashboard, { electionId: election._id }),
  );
  const live = useVotingStarted(electionDashboardSlug);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Change log</h1>
        <p className="text-sm text-muted-foreground">
          Every edit made to this election since voting opened. This record is
          append-only — entries can&apos;t be edited or removed, including by
          you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What voters see</CardTitle>
          <CardDescription>
            The same list appears on{' '}
            <Link
              to="/$electionSlug"
              params={{ electionSlug: election.slug }}
              className="inline-flex items-center gap-1 underline underline-offset-2"
            >
              the public election page
              <ExternalLink className="size-3" />
            </Link>{' '}
            for anyone who can view this election. Voter-list changes are shown
            there as counts only — no email addresses are published. This page
            shows you the full detail.
          </CardDescription>
        </CardHeader>
        {!live && (
          <CardContent className="text-sm text-muted-foreground">
            Voting hasn&apos;t opened yet, so nothing is being recorded.
            Everything you change now is ordinary setup. Once voting opens,
            edits start appearing here.
          </CardContent>
        )}
      </Card>

      <ChangeLogList entries={entries} />
    </div>
  );
}
