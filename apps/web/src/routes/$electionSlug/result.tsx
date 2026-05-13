import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { ConvexError } from 'convex/values';
import { api } from '@eboto/backend/api';
import dayjs from 'dayjs';

import { PagePending } from '~/components/page-pending';
import { CONVEX_ERROR_FORBIDDEN } from '~/lib/constants';
import { formatName } from '~/lib/election';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';

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

  const { election, positions, isCommissioner, tier } = data;

  return (
    <main className="container mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold">{election.name}</h1>
        <p className="text-muted-foreground mt-1">
          {dayjs(election.startDate).format('MMMM D, YYYY')} –{' '}
          {dayjs(election.endDate).format('MMMM D, YYYY')}
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          {tier?.nextRefreshAt ? (
            <Badge variant="secondary">
              Hourly results · next update{' '}
              {dayjs(tier.nextRefreshAt).format('h:mm A')}
            </Badge>
          ) : (
            <Badge variant="secondary">Live results</Badge>
          )}
          {isCommissioner && <Badge>Commissioner view</Badge>}
        </div>
      </header>

      <div className="space-y-8">
        {positions.map((position) => {
          const totalVotes = position.totalVotes || 1;
          return (
            <Card key={position.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl">{position.name}</CardTitle>
                <span className="text-muted-foreground text-sm">
                  {position.totalVotes} vote
                  {position.totalVotes === 1 ? '' : 's'}
                </span>
              </CardHeader>
              <CardContent className="space-y-3">
                {position.candidates.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No candidates yet.
                  </p>
                ) : (
                  position.candidates.map((candidate) => {
                    const name =
                      candidate.displayName ??
                      `${formatName(election.nameArrangement, candidate)}${
                        candidate.partylistAcronym
                          ? ` (${candidate.partylistAcronym})`
                          : ''
                      }`;
                    const pct = (candidate.votes / totalVotes) * 100;
                    return (
                      <div key={candidate.id}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span>{name}</span>
                          <span className="text-muted-foreground">
                            {candidate.votes} ({pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="bg-muted h-2 overflow-hidden rounded-full">
                          <div
                            className="bg-primary h-full rounded-full transition-[width]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}

                {position.abstainVotes > 0 && (
                  <div className="border-t pt-2 text-sm">
                    <span className="text-muted-foreground">
                      Abstain: {position.abstainVotes}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
