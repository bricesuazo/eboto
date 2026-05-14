import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { Fingerprint, Plus, Sparkles, Vote } from 'lucide-react';

import { api } from '@eboto/backend/api';

import { PagePending } from '~/components/page-pending';
import { Badge } from '~/components/ui/badge';
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
    await Promise.all([
      context.queryClient.ensureQueryData(
        convexQuery(api.dashboard.myElections, {}),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.dashboard.myVoterElections, {}),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.billing.myElectionQuota, {}),
      ),
    ]);
  },
  pendingComponent: PagePending,
  component: DashboardHome,
});

function DashboardHome() {
  const { data, isError, error } = useQuery(
    convexQuery(api.dashboard.myElections, {}),
  );
  const { data: voterData } = useQuery(
    convexQuery(api.dashboard.myVoterElections, {}),
  );
  const { data: quota } = useQuery(
    convexQuery(api.billing.myElectionQuota, {}),
  );
  const elections = data ?? [];
  const voterElections = voterData ?? [];

  return (
    <main className="container mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My elections</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Elections you commission. Click one to manage it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {quota && (
            <Badge variant="secondary" className="px-2 py-3 text-xs">
              <Fingerprint className="mr-1.5 size-3.5" />
              {quota.ownedCount} election{quota.ownedCount === 1 ? '' : 's'}
              {quota.plusCredits > 0 && (
                <span className="ml-1.5 text-emerald-600 dark:text-emerald-500">
                  · {quota.plusCredits} Plus
                </span>
              )}
            </Badge>
          )}
          <Button
            render={
              <Link to="/dashboard/new">
                <Plus className="size-4" />
                New election
              </Link>
            }
          />
        </div>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : elections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Fingerprint className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              You don't commission any elections yet.
            </p>
            <Button
              render={
                <Link to="/dashboard/new">Create your first election</Link>
              }
            />
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
              <Card className="h-full transition-colors hover:bg-accent">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {election.logoUrl ? (
                      <img
                        src={election.logoUrl}
                        alt=""
                        className="size-12 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Fingerprint className="size-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="truncate text-lg">
                          {election.name}
                        </CardTitle>
                        {election.variantId ? (
                          <Badge className="shrink-0 gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300">
                            <Sparkles className="size-3" />
                            Boost
                          </Badge>
                        ) : null}
                      </div>
                      <CardDescription className="truncate">
                        @{election.slug}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {dayjs(election.startDate).format('MMM D, YYYY')} –{' '}
                    {dayjs(election.endDate).format('MMM D, YYYY')}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {voterElections.length > 0 && (
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Elections you can vote in</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Elections that have invited you as a voter. Click one to view it.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {voterElections.map((election) => (
              <Link
                key={election._id}
                to="/$electionSlug"
                params={{ electionSlug: election.slug }}
              >
                <Card className="h-full transition-colors hover:bg-accent">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {election.logoUrl ? (
                        <img
                          src={election.logoUrl}
                          alt=""
                          className="size-12 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Vote className="size-6 text-muted-foreground" />
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
                    <p className="text-sm text-muted-foreground">
                      {dayjs(election.startDate).format('MMM D, YYYY')} –{' '}
                      {dayjs(election.endDate).format('MMM D, YYYY')}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
