import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
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
  ClipboardCheck,
  Clock3,
  Copy,
  Download,
  Fingerprint,
  Info,
  MessagesSquare,
  QrCode,
  User as UserIcon,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import { api } from '@eboto/backend/api';

import { PagePending } from '~/components/page-pending';
import { SubmittedBallot } from '~/components/submitted-ballot';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { cn } from '~/lib/utils';

export const Route = createFileRoute('/$electionSlug/')({
  pendingComponent: PagePending,
  component: ElectionPage,
});

type Status = 'live' | 'upcoming' | 'concluded';

function ElectionPage() {
  const { electionSlug } = Route.useParams();
  const { user } = useRouteContext({ from: '__root__' });
  const { data } = useQuery(
    convexQuery(api.elections.getBySlug, { slug: electionSlug }),
  );
  if (!data) throw notFound();

  const { election, positions, isVoter, hasVoted, isCommissioner } = data;
  const { data: myBallot } = useQuery({
    ...convexQuery(api.votes.myBallot, { slug: electionSlug }),
    enabled: hasVoted,
  });
  const ongoing = isElectionOngoing(election);
  const ended = isElectionEnded(election);
  const status: Status = ended ? 'concluded' : ongoing ? 'live' : 'upcoming';

  const dateRange =
    dayjs(election.startDate).format('MMM D, YYYY') +
    ' – ' +
    dayjs(election.endDate).format('MMM D, YYYY');
  const hours =
    election.votingHourStart === 0 && election.votingHourEnd === 24
      ? 'Whole day'
      : `${parseHourTo12HourFormat(election.votingHourStart)} – ${parseHourTo12HourFormat(election.votingHourEnd)}`;
  const visibilityLabel =
    election.publicity.charAt(0) + election.publicity.slice(1).toLowerCase();

  const canSeeResults =
    isCommissioner ||
    election.publicity === 'PUBLIC' ||
    ended ||
    (election.publicity === 'VOTER' && hasVoted);
  const canVote = ongoing && (!user || (isVoter && !hasVoted));
  const canMessage = isCommissioner || (isVoter && election.variantId !== 0);

  return (
    <main className="container mx-auto max-w-6xl px-6 py-10 sm:py-14">
      <header>
        <div className="flex flex-col items-center text-center">
          <StatusPill status={status} />

          <div className="mt-8 mb-6 flex size-24 items-center justify-center sm:size-28">
            {election.logoUrl ? (
              <img
                src={election.logoUrl}
                alt={`${election.name} logo`}
                className="size-full rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <div className="flex size-full items-center justify-center rounded-full border bg-muted/40">
                <Fingerprint
                  className="size-10 text-muted-foreground sm:size-12"
                  aria-hidden
                />
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            {election.name}
          </h1>
          <p className="mt-3 text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            @{election.slug}
          </p>

          {election.description && (
            <p className="mx-auto mt-6 max-w-prose leading-relaxed text-pretty text-muted-foreground">
              {election.description}
            </p>
          )}
        </div>

        <dl className="mt-10 grid grid-cols-1 divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <MetaCell label="Dates" value={dateRange} />
          <MetaCell label="Voting Hours" value={hours} />
          <MetaCell
            label="Visibility"
            value={visibilityLabel}
            info={describePublicity(election.publicity)}
          />
        </dl>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {canVote && (
            <Button
              render={
                user ? (
                  <Link
                    to="/$electionSlug/vote"
                    params={{ electionSlug: election.slug }}
                  >
                    <Fingerprint className="size-4" />
                    Vote now
                  </Link>
                ) : (
                  <Link to="/sign-in" search={{ to: `/${election.slug}/vote` }}>
                    <Fingerprint className="size-4" />
                    Vote now
                  </Link>
                )
              }
              size="lg"
            />
          )}
          {canSeeResults && (
            <Button
              render={
                <Link
                  to="/$electionSlug/result"
                  params={{ electionSlug: election.slug }}
                >
                  <Clock3 className="size-4" />
                  {ended ? 'View results' : 'Live results'}
                </Link>
              }
              variant={canVote ? 'outline' : 'default'}
              size="lg"
            />
          )}
          {hasVoted && (
            <Dialog>
              <DialogTrigger
                render={
                  <Button size="lg" variant="outline" disabled={!myBallot}>
                    <ClipboardCheck className="size-4" />
                    Your ballot
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Your ballot</DialogTitle>
                  <DialogDescription>
                    These are the selections you submitted for {election.name}.
                  </DialogDescription>
                </DialogHeader>
                {myBallot && (
                  <div className="max-h-[60vh] overflow-y-auto">
                    <SubmittedBallot
                      ballot={myBallot}
                      nameArrangement={election.nameArrangement}
                    />
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
          {/* Voter messaging is a Boost feature — hide for free elections.
              Commissioners always see the entry point (they manage the
              upgrade themselves). */}
          {canMessage && (
            <Button
              render={
                <Link
                  to="/$electionSlug/messages"
                  params={{ electionSlug: election.slug }}
                >
                  <MessagesSquare className="size-4" />
                  Messages
                </Link>
              }
              size="lg"
              variant="outline"
            />
          )}
          <ShareQrButton election={election} />
        </div>

        {ended ? (
          <p className="mt-6 text-center text-xs tracking-widest text-muted-foreground uppercase">
            This election has ended
          </p>
        ) : (
          !ongoing && (
            <p className="mt-6 text-center text-xs font-medium tracking-widest text-destructive uppercase">
              Voting is not yet open
            </p>
          )
        )}
      </header>

      <section className="mt-16 sm:mt-20">
        {positions.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <p className="text-sm text-muted-foreground">
              This election has no positions yet. Contact the election
              commissioner for more information.
            </p>
          </div>
        ) : (
          <div className="space-y-14 sm:space-y-20">
            <SectionLabel label="Positions & Candidates" />
            {positions.map((position, idx) => (
              <PositionSection
                key={position._id}
                index={idx}
                position={position}
                nameArrangement={election.nameArrangement}
                electionSlug={election.slug}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-border" aria-hidden />
      <p className="text-[10px] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
        {label}
      </p>
      <div className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}

function PositionSection({
  index,
  position,
  nameArrangement,
  electionSlug,
}: {
  index: number;
  position: {
    _id: string;
    name: string;
    min: number;
    max: number;
    candidates: {
      _id: string;
      slug: string;
      firstName: string;
      middleName?: string;
      lastName: string;
      imageUrl: string | null;
      partylist?: { acronym: string } | null;
    }[];
  };
  nameArrangement: number;
  electionSlug: string;
}) {
  const rule =
    position.min === 0 && position.max === 1
      ? 'Pick 1'
      : `Pick ${position.min}–${position.max}`;
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-foreground/15 pb-3">
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
            {position.name}
          </h2>
        </div>
        <span className="text-[10px] font-medium tracking-widest whitespace-nowrap text-muted-foreground uppercase">
          {rule} · {position.candidates.length}{' '}
          {position.candidates.length === 1 ? 'candidate' : 'candidates'}
        </span>
      </div>

      {position.candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No candidates for this position yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {position.candidates.map((candidate) => (
            <CandidateCard
              key={candidate._id}
              candidate={candidate}
              nameArrangement={nameArrangement}
              electionSlug={electionSlug}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CandidateCard({
  candidate,
  nameArrangement,
  electionSlug,
}: {
  candidate: {
    slug: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    imageUrl: string | null;
    partylist?: { acronym: string } | null;
  };
  nameArrangement: number;
  electionSlug: string;
}) {
  const name = formatName(nameArrangement, candidate);
  return (
    <Link
      to="/$electionSlug/$candidateSlug"
      params={{ electionSlug, candidateSlug: candidate.slug }}
      className="group block overflow-hidden rounded-md border bg-card transition-colors hover:border-foreground/30"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {candidate.imageUrl ? (
          <img
            src={candidate.imageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <UserIcon
            className="absolute inset-0 m-auto size-12 text-muted-foreground/60"
            aria-hidden
          />
        )}
      </div>
      <div className="border-t bg-card p-3">
        <p className="line-clamp-2 text-sm leading-snug font-medium text-balance">
          {name}
        </p>
        {candidate.partylist?.acronym && (
          <p className="mt-1 text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase">
            {candidate.partylist.acronym}
          </p>
        )}
      </div>
    </Link>
  );
}

function StatusPill({ status }: { status: Status }) {
  const config: Record<
    Status,
    { dot: string; label: string; animate?: boolean }
  > = {
    live: {
      dot: 'bg-emerald-500',
      label: 'Voting now open',
      animate: true,
    },
    upcoming: { dot: 'bg-amber-500', label: 'Upcoming' },
    concluded: { dot: 'bg-muted-foreground', label: 'Concluded' },
  };
  const { dot, label, animate } = config[status];
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-foreground uppercase">
      <span className="relative flex size-1.5" aria-hidden>
        {animate && (
          <span
            className={cn(
              'absolute inset-0 animate-ping rounded-full opacity-60',
              dot,
            )}
          />
        )}
        <span className={cn('relative size-1.5 rounded-full', dot)} />
      </span>
      {label}
    </span>
  );
}

function MetaCell({
  label,
  value,
  info,
}: {
  label: string;
  value: ReactNode;
  info?: string;
}) {
  return (
    <div className="px-4 py-4 sm:py-5">
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
        {label}
        {info && (
          <HoverCard>
            <HoverCardTrigger
              render={
                <button
                  type="button"
                  aria-label={`${label} info`}
                  className="text-muted-foreground/70 hover:text-foreground"
                >
                  <Info className="size-3" aria-hidden />
                </button>
              }
            />
            <HoverCardContent className="text-sm">{info}</HoverCardContent>
          </HoverCard>
        )}
      </dt>
      <dd className="mt-1.5 text-sm leading-snug font-medium">{value}</dd>
    </div>
  );
}

function ShareQrButton({
  election,
}: {
  election: { name: string; slug: string };
}) {
  const [open, setOpen] = useState(false);
  const qrWrapperRef = useRef<HTMLDivElement>(null);
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

  // Rasterizes the rendered <QRCodeSVG> to a 1024px PNG and downloads it.
  // Going through SVG → data URL → <img> → canvas avoids any extra deps
  // while still producing a crisp print-quality image.
  async function handleDownload() {
    const svg = qrWrapperRef.current?.querySelector('svg');
    if (!svg) return;
    const cloned = svg.cloneNode(true) as SVGSVGElement;
    if (!cloned.getAttribute('xmlns'))
      cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const xml = new XMLSerializer().serializeToString(cloned);
    const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`;
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('QR render failed'));
      img.src = dataUrl;
    });
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png'),
    );
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${election.slug}-eboto-qr.png`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        <QrCode className="size-4" />
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
          <div ref={qrWrapperRef} className="rounded-lg border bg-white p-4">
            <QRCodeSVG
              value={url}
              size={224}
              level="M"
              marginSize={0}
              aria-label={`QR code for ${election.name}`}
            />
          </div>
        </div>
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-center text-xs break-all text-muted-foreground">
          {url}
        </div>
        <DialogFooter className="sm:justify-center sm:gap-2">
          <Button
            variant="outline"
            onClick={handleCopy}
            className="w-full sm:w-auto"
          >
            <Copy className="size-4" />
            Copy link
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            className="w-full sm:w-auto"
          >
            <Download className="size-4" />
            Download PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
