import type { ReactNode } from 'react';
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
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  MinusCircle,
  Trophy,
} from 'lucide-react';

import { api } from '@eboto/backend/api';

import { PagePending } from '~/components/page-pending';
import { Button } from '~/components/ui/button';
import { CONVEX_ERROR_FORBIDDEN } from '~/lib/constants';
import {
  formatName,
  isElectionEnded,
  isElectionInProgress,
  parseHourTo12HourFormat,
} from '~/lib/election';
import { cn } from '~/lib/utils';

type Status = 'upcoming' | 'ongoing' | 'concluded';

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
  const ended = isElectionEnded(election);
  const inProgress = isElectionInProgress(election);
  const status: Status = ended
    ? 'concluded'
    : inProgress
      ? 'ongoing'
      : 'upcoming';
  const ongoing = status === 'ongoing';
  const upcoming = status === 'upcoming';

  const dateRange =
    dayjs(election.startDate).format('MMM D, YYYY') +
    ' – ' +
    dayjs(election.endDate).format('MMM D, YYYY');
  const hours =
    election.votingHourStart === 0 && election.votingHourEnd === 24
      ? 'Whole day'
      : `${parseHourTo12HourFormat(election.votingHourStart)} – ${parseHourTo12HourFormat(election.votingHourEnd)}`;

  const updatedValue: ReactNode = (() => {
    if (upcoming) return 'Not started';
    if (tier.nextRefreshAt && tier.resultsCutoff) {
      return (
        <span>
          As of{' '}
          <span className="tabular-nums">
            {dayjs(tier.resultsCutoff).format('h:mm A')}
          </span>
          <span className="mx-1.5 text-muted-foreground/60">·</span>
          Next{' '}
          <span className="tabular-nums">
            {dayjs(tier.nextRefreshAt).format('h:mm A')}
          </span>
        </span>
      );
    }
    if (ongoing) {
      return (
        <span className="inline-flex items-center gap-2">
          <span className="relative flex size-1.5" aria-hidden>
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative size-1.5 rounded-full bg-emerald-500" />
          </span>
          Live tally
        </span>
      );
    }
    return 'Final';
  })();

  return (
    <main className="container mx-auto max-w-6xl px-6 py-10 sm:py-14">
      <Button
        render={
          <Link to="/$electionSlug" params={{ electionSlug: election.slug }}>
            <ArrowLeft className="size-4" />
            Back to election
          </Link>
        }
        variant="ghost"
        size="sm"
        className="mb-8"
      />

      <header>
        <div className="flex flex-col items-center text-center">
          <StatusPill status={status} />
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            {election.name}
          </h1>
          <p className="mt-3 text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Election Results
          </p>
        </div>

        <dl className="mt-10 grid grid-cols-1 divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <MetaCell label="Dates" value={dateRange} />
          <MetaCell label="Voting Hours" value={hours} />
          <MetaCell label="Updated" value={updatedValue} />
        </dl>
      </header>

      {ongoing && (
        <div className="mt-10 flex items-start gap-3 rounded-md border border-amber-500/40 bg-amber-50 p-4 dark:bg-amber-500/10">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-amber-900 uppercase dark:text-amber-200">
              Partial & Unofficial
            </p>
            <p className="text-sm leading-relaxed text-amber-900/90 dark:text-amber-100/90">
              Voting is still in progress — tallies will continue to change as
              ballots come in. Final, official results will be available once
              the election concludes on{' '}
              <span className="font-medium tabular-nums">
                {dayjs(election.endDate).format('MMM D, YYYY')}
              </span>{' '}
              at{' '}
              <span className="font-medium tabular-nums">
                {parseHourTo12HourFormat(election.votingHourEnd)}
              </span>
              .
            </p>
          </div>
        </div>
      )}

      {upcoming && (
        <div className="mt-10 flex items-start gap-3 rounded-md border bg-muted/40 p-4">
          <CalendarClock
            className="text-muted-foreground mt-0.5 size-4 shrink-0"
            aria-hidden
          />
          <div className="space-y-1">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.18em] uppercase">
              Voting hasn't started
            </p>
            <p className="text-sm leading-relaxed">
              Ballots will appear here once voting opens on{' '}
              <span className="font-medium tabular-nums">
                {dayjs(election.startDate).format('MMM D, YYYY')}
              </span>{' '}
              at{' '}
              <span className="font-medium tabular-nums">
                {parseHourTo12HourFormat(election.votingHourStart)}
              </span>
              .
            </p>
          </div>
        </div>
      )}

      <section className="mt-12 sm:mt-16">
        <SectionLabel
          label={
            upcoming
              ? 'Standings'
              : ongoing
                ? 'Live Standings'
                : 'Final Standings'
          }
        />
        <div className="mt-10 space-y-12 sm:space-y-16">
          {positions.map((position, idx) => (
            <PositionResult
              key={position.id}
              index={idx}
              position={position}
              ongoing={ongoing}
              nameArrangement={election.nameArrangement}
            />
          ))}
        </div>
      </section>

      {ongoing && (
        <p className="mt-12 text-center text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Partial & unofficial — revisit for the latest tally
        </p>
      )}
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

interface PositionResultData {
  id: string;
  name: string;
  totalVotes: number;
  abstainVotes: number;
  candidates: {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    partylistAcronym: string;
    displayName?: string;
    votes: number;
  }[];
}

function PositionResult({
  index,
  position,
  ongoing,
  nameArrangement,
}: {
  index: number;
  position: PositionResultData;
  ongoing: boolean;
  nameArrangement: number;
}) {
  const denom = position.totalVotes || 1;
  const topVotes = position.candidates[0]?.votes ?? 0;

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
        <p className="text-[10px] font-medium tracking-widest whitespace-nowrap text-muted-foreground uppercase tabular-nums">
          {position.totalVotes.toLocaleString()}{' '}
          {position.totalVotes === 1 ? 'vote' : 'votes'} cast
        </p>
      </div>

      {position.candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No candidates.</p>
      ) : (
        <ol className="space-y-4">
          {position.candidates.map((candidate, i) => {
            const name =
              candidate.displayName ??
              `${formatName(nameArrangement, candidate)}${
                candidate.partylistAcronym
                  ? ` (${candidate.partylistAcronym})`
                  : ''
              }`;
            const pct = (candidate.votes / denom) * 100;
            const isLeading =
              candidate.votes > 0 && candidate.votes === topVotes;
            const showWinner = !ongoing && isLeading;
            return (
              <li key={candidate.id} className="space-y-2">
                <div className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-start gap-3">
                    <RankBadge
                      rank={i + 1}
                      isLeading={isLeading}
                      showWinner={showWinner}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate',
                          isLeading ? 'font-semibold' : 'font-medium',
                        )}
                      >
                        {name}
                      </p>
                      {showWinner && (
                        <p className="mt-0.5 text-[10px] font-semibold tracking-[0.2em] text-amber-700 uppercase dark:text-amber-400">
                          Winner
                        </p>
                      )}
                      {ongoing && isLeading && !showWinner && (
                        <p className="mt-0.5 text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
                          Leading
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right tabular-nums">
                    <span
                      className={cn(
                        'block leading-none',
                        isLeading ? 'font-semibold' : 'font-medium',
                      )}
                    >
                      {candidate.votes.toLocaleString()}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-none text-muted-foreground">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="ml-10 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-[width] duration-500 ease-out',
                      showWinner
                        ? 'bg-amber-500'
                        : isLeading
                          ? 'bg-primary'
                          : 'bg-primary/30',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {position.abstainVotes > 0 && (
        <div className="mt-6 flex items-center justify-between gap-3 border-t pt-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MinusCircle className="size-3.5" aria-hidden />
            <span>Abstained</span>
          </div>
          <span className="text-right text-muted-foreground tabular-nums">
            <span className="font-medium text-foreground">
              {position.abstainVotes.toLocaleString()}
            </span>
            <span className="ml-1.5 text-xs">
              {((position.abstainVotes / denom) * 100).toFixed(1)}%
            </span>
          </span>
        </div>
      )}
    </section>
  );
}

function RankBadge({
  rank,
  isLeading,
  showWinner,
}: {
  rank: number;
  isLeading: boolean;
  showWinner: boolean;
}) {
  return (
    <span
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums',
        showWinner
          ? 'border-amber-500/60 bg-amber-500/15 text-amber-700 dark:text-amber-300'
          : isLeading
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'border-border bg-card text-muted-foreground',
      )}
      aria-hidden
    >
      {showWinner ? <Trophy className="size-3.5" /> : rank}
    </span>
  );
}

function StatusPill({ status }: { status: Status }) {
  if (status === 'ongoing') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-50 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-amber-800 uppercase dark:bg-amber-500/10 dark:text-amber-300">
        <span className="relative flex size-1.5" aria-hidden>
          <span className="absolute inset-0 animate-ping rounded-full bg-amber-500 opacity-60" />
          <span className="relative size-1.5 rounded-full bg-amber-500" />
        </span>
        Election ongoing
      </span>
    );
  }
  if (status === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-foreground uppercase">
        <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
        Upcoming
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-foreground uppercase">
      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
      Concluded
    </span>
  );
}

function MetaCell({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="px-4 py-4 sm:py-5">
      <dt className="text-[10px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm leading-snug font-medium">{value}</dd>
    </div>
  );
}
