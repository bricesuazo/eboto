import { Link, createFileRoute, notFound } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { api } from '@eboto/backend/api';
import {
  Clock3,
  Fingerprint,
  Info,
  QrCode,
  User as UserIcon,
} from 'lucide-react';
import dayjs from 'dayjs';
import {
  describePublicity,
  formatName,
  isElectionEnded,
  isElectionOngoing,
  parseHourTo12HourFormat,
} from '~/lib/election';
import { PagePending } from '~/components/page-pending';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '~/components/ui/hover-card';

export const Route = createFileRoute('/$electionSlug/')({
  beforeLoad: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      convexQuery(api.elections.getBySlug, { slug: params.electionSlug }),
    );
    if (!data) throw notFound();
  },
  pendingComponent: PagePending,
  head: ({ params }) => ({
    meta: [
      { title: `${params.electionSlug} | eBoto` },
      {
        name: 'description',
        content: `View details about the ${params.electionSlug} election on eBoto.`,
      },
    ],
  }),
  component: ElectionPage,
});

function ElectionPage() {
  const { electionSlug } = Route.useParams();
  const { data } = useQuery(
    convexQuery(api.elections.getBySlug, { slug: electionSlug }),
  );
  if (!data) throw notFound();

  const { election, positions } = data;
  const ongoing = isElectionOngoing(election);
  const ended = isElectionEnded(election);
  const dateRange =
    dayjs(election.startDate).format('MMMM D, YYYY') +
    ' – ' +
    dayjs(election.endDate).format('MMMM D, YYYY');

  return (
    <main className="container mx-auto max-w-4xl px-6 py-12">
      <header className="flex flex-col items-center text-center">
        <div className="mb-3 flex size-32 items-center justify-center">
          {election.logoUrl ? (
            <img
              src={election.logoUrl}
              alt={`${election.name} logo`}
              className="size-32 rounded-full object-cover"
            />
          ) : (
            <Fingerprint className="size-24 text-muted-foreground" />
          )}
        </div>
        <h1 className="text-balance text-3xl font-bold sm:text-4xl">
          {election.name}{' '}
          <span className="text-muted-foreground font-normal">
            (@{election.slug})
          </span>
        </h1>
        <p className="text-muted-foreground mt-1">{dateRange}</p>
        <p className="text-muted-foreground text-sm">
          Voting hours:{' '}
          {election.votingHourStart === 0 && election.votingHourEnd === 24
            ? 'Whole day'
            : `${parseHourTo12HourFormat(election.votingHourStart)} – ${parseHourTo12HourFormat(election.votingHourEnd)}`}
        </p>

        <div className="mt-3 flex items-center gap-1.5">
          <Badge variant="secondary">
            {election.publicity.charAt(0) +
              election.publicity.slice(1).toLowerCase()}
          </Badge>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                aria-label="Publicity info"
                className="text-muted-foreground hover:text-foreground"
              >
                <Info className="size-4" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="text-sm">
              {describePublicity(election.publicity)}
            </HoverCardContent>
          </HoverCard>
        </div>

        {election.description && (
          <p className="text-muted-foreground mt-4 max-w-prose text-pretty">
            {election.description}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {(election.publicity === 'PUBLIC' || ended) && (
            <Button asChild size="lg" className="rounded-full">
              <Link
                to="/$electionSlug/result"
                params={{ electionSlug: election.slug }}
              >
                <Clock3 className="mr-2 size-4" />
                Realtime count
              </Link>
            </Button>
          )}
          {ongoing && (
            <Button asChild size="lg" className="rounded-full">
              <Link
                to="/$electionSlug/vote"
                params={{ electionSlug: election.slug }}
              >
                <Fingerprint className="mr-2 size-4" />
                Vote now!
              </Link>
            </Button>
          )}
          <Button variant="outline" size="lg" className="rounded-full">
            <QrCode className="mr-2 size-4" />
            Share QR
          </Button>
        </div>

        {ended ? (
          <p className="text-muted-foreground mt-6 text-sm">
            This election has ended.
          </p>
        ) : (
          !ongoing && (
            <p className="mt-6 text-sm text-destructive">
              Voting is not yet open.
            </p>
          )
        )}
      </header>

      <section className="mt-12 space-y-12">
        {positions.length === 0 ? (
          <p className="text-muted-foreground text-center">
            This election has no positions yet. Contact the election
            commissioner for more information.
          </p>
        ) : (
          positions.map((position) => (
            <div key={position._id}>
              <div className="bg-background/80 sticky top-14 z-10 flex items-center justify-center gap-2 py-3 backdrop-blur">
                <h2 className="text-balance text-2xl font-semibold">
                  {position.name}
                </h2>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button
                      aria-label="Position rules"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Info className="size-4" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="text-sm">
                    {position.min === 0 && position.max === 1
                      ? `Voters can only vote 1 candidate for ${position.name}.`
                      : `Voters can vote a minimum of ${position.min} and a maximum of ${position.max} candidates for ${position.name}.`}
                  </HoverCardContent>
                </HoverCard>
              </div>

              {position.candidates.length === 0 ? (
                <p className="text-muted-foreground text-center text-lg">
                  No candidates for {position.name} yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {position.candidates.map((candidate) => {
                    const name =
                      formatName(election.nameArrangement, candidate) +
                      (candidate.partylist
                        ? ` (${candidate.partylist.acronym})`
                        : '');
                    return (
                      <Link
                        key={candidate._id}
                        to="/$electionSlug/$candidateSlug"
                        params={{
                          electionSlug: election.slug,
                          candidateSlug: candidate.slug,
                        }}
                        className="hover:bg-accent rounded-lg border p-3 transition-colors"
                      >
                        <div className="bg-muted relative aspect-square overflow-hidden rounded-md">
                          {candidate.imageUrl ? (
                            <img
                              src={candidate.imageUrl}
                              alt={name}
                              className="absolute inset-0 size-full object-cover"
                            />
                          ) : (
                            <UserIcon className="text-muted-foreground absolute inset-0 m-auto size-16" />
                          )}
                        </div>
                        <p className="line-clamp-2 mt-2 text-center text-sm">
                          {name}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </main>
  );
}
