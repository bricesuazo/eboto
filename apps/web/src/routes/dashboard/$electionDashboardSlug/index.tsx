import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import dayjs from 'dayjs';

import { api } from '@eboto/backend/api';

import { DashboardPending } from '~/components/dashboard-pending';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

export const Route = createFileRoute(
  '/dashboard/$electionDashboardSlug/',
)({
  beforeLoad: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.elections.getDashboardBySlug, {
        slug: params.electionDashboardSlug,
      }),
    );
  },
  pendingComponent: DashboardPending,
  component: OverviewPage,
});

function OverviewPage() {
  const { electionDashboardSlug } = Route.useParams();
  const { data: election } = useQuery(
    convexQuery(api.elections.getDashboardBySlug, {
      slug: electionDashboardSlug,
    }),
  );
  if (!election) throw notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground text-sm">
          Quick stats for {election.name}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Voting window</CardDescription>
            <CardTitle className="text-base font-semibold">
              {dayjs(election.startDate).format('MMM D, YYYY')} –{' '}
              {dayjs(election.endDate).format('MMM D, YYYY')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Daily {election.votingHourStart}:00 – {election.votingHourEnd}:00
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Publicity</CardDescription>
            <CardTitle className="text-base font-semibold capitalize">
              {election.publicity.toLowerCase()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {election.noOfVoters
                ? `Up to ${election.noOfVoters.toLocaleString()} voters`
                : 'Voter quota not set'}
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground text-sm">
        More dashboards (turnout, recent votes, message inbox) land in the
        next phase.
      </p>
    </div>
  );
}
