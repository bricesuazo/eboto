import { useState } from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  notFound,
  useRouteContext,
} from '@tanstack/react-router';
import dayjs from 'dayjs';
import {
  Clock3,
  Copy,
  Fingerprint,
  Info,
  QrCode,
  User as UserIcon,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import { api } from '@eboto/backend/api';

import { PagePending } from '~/components/page-pending';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '~/components/ui/hover-card';
import {
  describePublicity,
  formatName,
  isElectionEnded,
  isElectionOngoing,
  parseHourTo12HourFormat,
} from '~/lib/election';

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
  const { user } = useRouteContext({ from: '__root__' });
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
            <HoverCardTrigger
              render={
                <button
                  aria-label="Publicity info"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Info className="size-4" />
                </button>
              }
            />
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
            <Button
              render={
                <Link
                  to="/$electionSlug/result"
                  params={{ electionSlug: election.slug }}
                >
                  <Clock3 className="mr-2 size-4" />
                  Realtime count
                </Link>
              }
              size="lg"
              className="rounded-full"
            />
          )}
          {ongoing && (
            <Button
              render={
                user ? (
                  <Link
                    to="/$electionSlug/vote"
                    params={{ electionSlug: election.slug }}
                  >
                    <Fingerprint className="mr-2 size-4" />
                    Vote now!
                  </Link>
                ) : (
                  <Link to="/sign-in" search={{ to: `/${election.slug}/vote` }}>
                    <Fingerprint className="mr-2 size-4" />
                    Vote now!
                  </Link>
                )
              }
              size="lg"
              className="rounded-full"
            />
          )}
          <ShareQrButton election={election} />
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
                  <HoverCardTrigger
                    render={
                      <button
                        aria-label="Position rules"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Info className="size-4" />
                      </button>
                    }
                  />
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

function ShareQrButton({
  election,
}: {
  election: { name: string; slug: string };
}) {
  const [open, setOpen] = useState(false);
  // Build the absolute URL on the client; SSR can't know the host reliably.
  const url =
    typeof window === 'undefined'
      ? `/${election.slug}`
      : `${window.location.origin}/${election.slug}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="lg"
        className="rounded-full"
        onClick={() => setOpen(true)}
      >
        <QrCode className="mr-2 size-4" />
        Share QR
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Share this election</DialogTitle>
          <DialogDescription>
            Scan to open {election.name}, or copy the link.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-2">
          <div className="rounded-lg border bg-white p-4">
            <QRCodeSVG
              value={url}
              size={224}
              level="M"
              marginSize={0}
              aria-label={`QR code for ${election.name}`}
            />
          </div>
        </div>
        <div className="text-muted-foreground break-all rounded-md border bg-muted/40 px-3 py-2 text-center text-xs">
          {url}
        </div>
        <DialogFooter className="sm:justify-center">
          <Button
            variant="outline"
            onClick={handleCopy}
            className="w-full sm:w-auto"
          >
            <Copy className="mr-2 size-4" />
            Copy link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
