import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  notFound,
  redirect,
} from '@tanstack/react-router';
import { ConvexError } from 'convex/values';
import dayjs from 'dayjs';
import { AlertTriangle, ArrowLeft, MinusCircle, Trophy } from 'lucide-react';

import { api } from '@eboto/backend/api';

import { PagePending } from '~/components/page-pending';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { CONVEX_ERROR_FORBIDDEN } from '~/lib/constants';
import {
  formatName,
  isElectionEnded,
  parseHourTo12HourFormat,
} from '~/lib/election';
import { cn } from '~/lib/utils';

export const Route = createFileRoute('/$electionSlug/result')({
  beforeLoad: async ({ context, params }) => {
    try {
      const data = await context.queryClient.ensureQueryData(
        convexQuery(api.results.getBySlug, { slug: params.electionSlug }),
      );
      if (!data) throw notFound();
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { code?: string };
        if (data.code === CONVEX_ERROR_FORBIDDEN) {
          throw redirect({
            to: '/$electionSlug',
            params: { electionSlug: params.electionSlug },
          });
        }
      }
      throw err;
    }
  },
  pendingComponent: PagePending,
  component: ResultPage,
});

function ResultPage() {
  const { electionSlug } = Route.useParams();
  // Convex queries are reactive — this re-renders as new votes land.
  const { data } = useQuery(
    convexQuery(api.results.getBySlug, { slug: electionSlug }),
  );
  if (!data) throw notFound();

  const { election, positions, tier } = data;
  const ongoing = !isElectionEnded(election);

  return (
    <main className="container mx-auto max-w-4xl px-6 py-12">
      <Button
        render={
          <Link to="/$electionSlug" params={{ electionSlug: election.slug }}>
            <ArrowLeft className="size-4" />
            Back to election
          </Link>
        }
        variant="ghost"
        size="sm"
        className="mb-6"
      />
      <header className="text-center">
        <div className="mb-3 flex justify-center">
          <StatusPill ongoing={ongoing} />
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">{election.name}</h1>
        <p className="mt-2 text-muted-foreground">
          {dayjs(election.startDate).format('MMMM D, YYYY')} –{' '}
          {dayjs(election.endDate).format('MMMM D, YYYY')}
          <span className="mx-2">·</span>
          {election.votingHourStart === 0 && election.votingHourEnd === 24
            ? 'Whole day'
            : `${parseHourTo12HourFormat(election.votingHourStart)} – ${parseHourTo12HourFormat(election.votingHourEnd)}`}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {tier.nextRefreshAt && tier.resultsCutoff ? (
            <>
              <Badge variant="secondary">
                As of {dayjs(tier.resultsCutoff).format('h:mm A')}
              </Badge>
              <Badge variant="outline">
                Next update {dayjs(tier.nextRefreshAt).format('h:mm A')}
              </Badge>
            </>
          ) : ongoing ? (
            <Badge variant="secondary">
              <span
                className="mr-1.5 size-1.5 animate-pulse rounded-full bg-emerald-500"
                aria-hidden
              />
              Live tally
            </Badge>
          ) : (
            <Badge variant="secondary">
              <span
                className="mr-1.5 size-1.5 rounded-full bg-emerald-500"
                aria-hidden
              />
              Official Results
            </Badge>
          )}
        </div>
      </header>

      {ongoing && (
        <div className="mt-8 flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
          <AlertTriangle
            className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <div className="space-y-1">
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              Partial and Unofficial Result
            </p>
            <p className="text-sm leading-relaxed text-amber-900/80 dark:text-amber-200/80">
              Voting is still in progress — tallies will continue to change as
              ballots come in. Final, official results will be available once
              the election concludes on{' '}
              <span className="font-medium">
                {dayjs(election.endDate).format('MMMM D, YYYY')}
              </span>{' '}
              at{' '}
              <span className="font-medium">
                {parseHourTo12HourFormat(election.votingHourEnd)}
              </span>
              .
            </p>
          </div>
        </div>
      )}

      <div className="mt-10 space-y-6">
        {positions.map((position) => {
          const denom = position.totalVotes || 1;
          const topVotes = position.candidates[0]?.votes ?? 0;
          return (
            <Card key={position.id}>
              <CardHeader className="flex-row items-baseline justify-between gap-3 space-y-0">
                <CardTitle className="text-xl">{position.name}</CardTitle>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {position.totalVotes.toLocaleString()} vote
                  {position.totalVotes === 1 ? '' : 's'}
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                {position.candidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No candidates yet.
                  </p>
                ) : (
                  position.candidates.map((candidate, index) => {
                    const name =
                      candidate.displayName ??
                      `${formatName(election.nameArrangement, candidate)}${
                        candidate.partylistAcronym
                          ? ` (${candidate.partylistAcronym})`
                          : ''
                      }`;
                    const pct = (candidate.votes / denom) * 100;
                    const isLeading =
                      candidate.votes > 0 && candidate.votes === topVotes;
                    const showWinner = !ongoing && isLeading;
                    return (
                      <div key={candidate.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className={cn(
                                'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                                showWinner
                                  ? 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                                  : isLeading
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground',
                              )}
                              aria-hidden
                            >
                              {showWinner ? (
                                <Trophy className="size-3.5" />
                              ) : (
                                index + 1
                              )}
                            </span>
                            <span
                              className={cn(
                                'truncate',
                                isLeading && 'font-medium',
                              )}
                            >
                              {name}
                            </span>
                          </div>
                          <span className="shrink-0 text-muted-foreground tabular-nums">
                            <span className="font-medium text-foreground">
                              {candidate.votes.toLocaleString()}
                            </span>{' '}
                            <span className="text-xs">
                              ({pct.toFixed(1)}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full transition-[width] duration-500 ease-out',
                              isLeading ? 'bg-primary' : 'bg-primary/35',
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}

                {position.abstainVotes > 0 && (
                  <div className="flex items-center gap-2 border-t pt-3 text-sm text-muted-foreground">
                    <MinusCircle className="size-3.5" aria-hidden />
                    <span>
                      {position.abstainVotes.toLocaleString()} abstain
                      {position.abstainVotes === 1 ? '' : 's'}
                      <span className="ml-1 text-xs">
                        (
                        {(
                          (position.abstainVotes / denom) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {ongoing && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          These results are partial and unofficial. Refresh or revisit for the
          latest tally.
        </p>
      )}
    </main>
  );
}

function StatusPill({ ongoing }: { ongoing: boolean }) {
  if (ongoing) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
        <span
          className="size-1.5 animate-pulse rounded-full bg-amber-500"
          aria-hidden
        />
        Election ongoing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
      Concluded
    </span>
  );
}
