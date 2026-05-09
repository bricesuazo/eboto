import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { Fingerprint, Plus } from 'lucide-react';

import { api } from '@eboto/backend/api';

import { PagePending } from '~/components/page-pending';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.dashboard.myElections, {}),
    );
  },
  pendingComponent: PagePending,
  component: DashboardHome,
});

function DashboardHome() {
  const { data, isError, error } = useQuery(
    convexQuery(api.dashboard.myElections, {}),
  );
  const elections = data ?? [];

  return (
    <main className="container mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My elections</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Elections you commission. Click one to manage it.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/new">
            <Plus className="mr-2 size-4" />
            New election
          </Link>
        </Button>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">
          {error?.message ?? 'Failed to load elections.'}
        </p>
      ) : elections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Fingerprint className="text-muted-foreground size-10" />
            <p className="text-muted-foreground">
              You don't commission any elections yet.
            </p>
            <Button asChild>
              <Link to="/dashboard/new">Create your first election</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {elections.map((election) => (
            <Link
              key={election._id}
              to="/dashboard/$electionDashboardSlug"
              params={{ electionDashboardSlug: election.slug }}
            >
              <Card className="hover:bg-accent transition-colors h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {election.logoUrl ? (
                      <img
                        src={election.logoUrl}
                        alt=""
                        className="size-12 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex size-12 shrink-0 items-center justify-center rounded-md">
                        <Fingerprint className="text-muted-foreground size-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <CardTitle className="truncate text-lg">
                        {election.name}
                      </CardTitle>
                      <CardDescription className="truncate">
                        @{election.slug}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {dayjs(election.startDate).format('MMM D, YYYY')} –{' '}
                    {dayjs(election.endDate).format('MMM D, YYYY')}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
