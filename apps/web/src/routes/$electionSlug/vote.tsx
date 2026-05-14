import { useMemo, useState } from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  notFound,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { Check, MinusCircle, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@eboto/backend/api';
import type { Id } from '@eboto/backend/data-model';

import { PagePending } from '~/components/page-pending';
import { SubmittedBallot } from '~/components/submitted-ballot';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import {
  CONVEX_ERROR_FORBIDDEN,
  CONVEX_ERROR_NOT_FOUND,
  CONVEX_ERROR_VOTING_CLOSED,
} from '~/lib/constants';
import { formatName, isVotingOpen } from '~/lib/election';
import type { Choice } from '~/lib/stores/ballot';
import { useBallotStore } from '~/lib/stores/ballot';
import { cn } from '~/lib/utils';

export const Route = createFileRoute('/$electionSlug/vote')({
  beforeLoad: async ({ context, params }) => {
    try {
      const data = await context.queryClient.ensureQueryData(
        convexQuery(api.votes.getVotingPage, { slug: params.electionSlug }),
      );
      if (!isVotingOpen(data.election)) {
        throw redirect({
          to: '/$electionSlug',
          params: { electionSlug: params.electionSlug },
        });
      }
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { code?: string; message?: string };
        if (data.code === CONVEX_ERROR_NOT_FOUND) throw notFound();
        if (
          data.code === CONVEX_ERROR_VOTING_CLOSED ||
          data.code === CONVEX_ERROR_FORBIDDEN
        ) {
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
  component: BallotPage,
});

function BallotPage() {
  const { electionSlug } = Route.useParams();
  const navigate = useNavigate();
  const { data } = useQuery(
    convexQuery(api.votes.getVotingPage, { slug: electionSlug }),
  );
  if (!data) throw notFound();
  // Extract into locals so the narrowing survives into nested closures.
  const { election, positions, hasVoted } = data;
  const cast = useMutation(api.votes.cast);
  const { data: myBallot } = useQuery({
    ...convexQuery(api.votes.myBallot, { slug: electionSlug }),
    enabled: hasVoted,
  });

  const stored = useBallotStore((s) => s.ballots[election._id]);
  const setStoreChoice = useBallotStore((s) => s.setChoice);
  const toggleStoreCandidate = useBallotStore((s) => s.toggleCandidate);
  const clearBallot = useBallotStore((s) => s.clearBallot);

  const selections = useMemo<Record<string, Choice>>(() => {
    const init: Record<string, Choice> = {};
    for (const p of positions) {
      const cur = stored?.[p._id];
      if (cur?.kind === 'abstain') {
        init[p._id] = { kind: 'abstain' };
      } else if (cur?.kind === 'candidates') {
        const valid = new Set(p.candidates.map((c) => c._id));
        init[p._id] = {
          kind: 'candidates',
          candidateIds: cur.candidateIds
            .filter((id) => valid.has(id))
            .slice(0, p.max),
        };
      } else {
        init[p._id] = { kind: 'candidates', candidateIds: [] };
      }
    }
    return init;
  }, [positions, stored]);

  const [submitting, setSubmitting] = useState(false);

  if (hasVoted) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-foreground uppercase">
            <Check
              className="size-3 text-primary"
              strokeWidth={3}
              aria-hidden
            />
            Ballot submitted
          </span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            You've cast your vote
          </h1>
          <p className="mt-3 text-muted-foreground">
            Each voter gets one ballot per election.
          </p>
        </div>
        {myBallot && (
          <SubmittedBallot
            ballot={myBallot}
            nameArrangement={election.nameArrangement}
            heading="Your selections"
            className="mt-10"
          />
        )}
        <div className="mt-10 flex justify-center">
          <Button
            render={
              <Link
                to="/$electionSlug"
                params={{ electionSlug: election.slug }}
              >
                Back to election
              </Link>
            }
            variant="outline"
          />
        </div>
      </main>
    );
  }

  function setChoice(positionId: string, choice: Choice) {
    setStoreChoice(election._id, positionId, choice);
  }

  function toggleCandidate(
    positionId: string,
    candidateId: Id<'candidates'>,
    max: number,
  ) {
    toggleStoreCandidate(election._id, positionId, candidateId, max);
  }

  async function submit() {
    setSubmitting(true);
    try {
      await cast({
        electionId: election._id,
        selections: positions.map((p) => ({
          positionId: p._id,
          choice: selections[p._id] ?? { kind: 'abstain' },
        })),
      });
      clearBallot(election._id);
      toast.success('Ballot submitted!');
      await navigate({
        to: '/$electionSlug',
        params: { electionSlug: election.slug },
      });
    } catch (err) {
      const msg =
        err instanceof ConvexError
          ? (err.data as { message?: string }).message
          : 'Failed to cast ballot';
      toast.error(msg ?? 'Failed to cast ballot');
    } finally {
      setSubmitting(false);
    }
  }

  // Progress: a position is "complete" when at least `min` candidates are
  // chosen, or when the voter explicitly abstained.
  const completedCount = positions.filter((p) => {
    const sel = selections[p._id];
    if (!sel) return false;
    if (sel.kind === 'abstain') return true;
    return sel.candidateIds.length >= p.min;
  }).length;
  const totalPositions = positions.length;
  const progressPct =
    totalPositions === 0 ? 0 : (completedCount / totalPositions) * 100;

  return (
    <>
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="container mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              Ballot Progress
            </p>
            <p className="text-xs tabular-nums text-muted-foreground">
              <span className="font-semibold text-foreground">
                {completedCount}
              </span>{' '}
              / {totalPositions}{' '}
              {totalPositions === 1 ? 'position' : 'positions'}
            </p>
          </div>
          <div
            className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={Math.round(progressPct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-3xl px-4 pt-10 pb-32 sm:px-6 sm:pt-14">
        <header>
          <p className="text-[10px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            Official ballot
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {election.name}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Make your selections below. You can review everything before
            submitting — once your ballot is cast, it cannot be changed.
          </p>
        </header>

        <div className="mt-12 space-y-14 sm:space-y-16">
          {positions.map((position, idx) => {
            const sel = selections[position._id];
            if (!sel) return null;
            const isSingle = position.min === 0 && position.max === 1;
            const selectedCount =
              sel.kind === 'candidates' ? sel.candidateIds.length : 0;
            const isAbstain = sel.kind === 'abstain';

            return (
              <PositionBlock
                key={position._id}
                index={idx}
                position={position}
                nameArrangement={election.nameArrangement}
                isSingle={isSingle}
                isAbstain={isAbstain}
                selectedCount={selectedCount}
                sel={sel}
                setChoice={setChoice}
                toggleCandidate={toggleCandidate}
              />
            );
          })}
        </div>
      </main>

      <div className="fixed right-0 bottom-0 left-0 z-30 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="container mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="hidden text-xs text-muted-foreground sm:block">
            Once submitted, your ballot is final.
          </p>
          <div className="flex flex-1 items-center justify-end gap-2">
            <Button
              render={
                <Link
                  to="/$electionSlug"
                  params={{ electionSlug: election.slug }}
                >
                  Cancel
                </Link>
              }
              variant="ghost"
            />
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit ballot'}
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm your ballot</AlertDialogTitle>
                  <AlertDialogDescription>
                    Review your selections below. Once submitted, your ballot
                    is final and cannot be changed.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <ul className="max-h-[50vh] divide-y overflow-y-auto rounded-md border text-sm">
                  {positions.map((p) => {
                    const s = selections[p._id];
                    let detail: React.ReactNode;
                    if (!s || s.kind === 'candidates') {
                      const names =
                        s?.kind === 'candidates'
                          ? s.candidateIds
                              .map((id) =>
                                p.candidates.find((c) => c._id === id),
                              )
                              .filter((c): c is NonNullable<typeof c> =>
                                Boolean(c),
                              )
                              .map((c) => {
                                const name = formatName(
                                  election.nameArrangement,
                                  c,
                                );
                                return c.partylistAcronym
                                  ? `${name} (${c.partylistAcronym})`
                                  : name;
                              })
                          : [];
                      if (names.length === 0) {
                        const required = p.min > 0;
                        detail = (
                          <p
                            className={cn(
                              'text-muted-foreground italic',
                              required && 'text-amber-600 dark:text-amber-500',
                            )}
                          >
                            {required
                              ? `No selection — pick at least ${p.min}`
                              : 'No selection'}
                          </p>
                        );
                      } else {
                        detail = (
                          <ul className="list-disc space-y-0.5 pl-5">
                            {names.map((n) => (
                              <li key={n}>{n}</li>
                            ))}
                          </ul>
                        );
                      }
                    } else {
                      detail = (
                        <p className="text-muted-foreground italic">
                          Abstained
                        </p>
                      );
                    }
                    return (
                      <li key={p._id} className="px-3 py-2">
                        <p className="font-medium">{p.name}</p>
                        <div className="mt-1">{detail}</div>
                      </li>
                    );
                  })}
                </ul>

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={submitting}>
                    Go back
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => void submit()}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting…' : 'Confirm & submit'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </>
  );
}

interface PositionData {
  _id: Id<'positions'>;
  name: string;
  min: number;
  max: number;
  candidates: {
    _id: Id<'candidates'>;
    firstName: string;
    middleName?: string;
    lastName: string;
    imageUrl: string | null;
    partylistAcronym: string;
  }[];
}

function PositionBlock({
  index,
  position,
  nameArrangement,
  isSingle,
  isAbstain,
  selectedCount,
  sel,
  setChoice,
  toggleCandidate,
}: {
  index: number;
  position: PositionData;
  nameArrangement: number;
  isSingle: boolean;
  isAbstain: boolean;
  selectedCount: number;
  sel: Choice;
  setChoice: (positionId: string, choice: Choice) => void;
  toggleCandidate: (
    positionId: string,
    candidateId: Id<'candidates'>,
    max: number,
  ) => void;
}) {
  const rule = isSingle
    ? 'Choose 1'
    : `Choose ${position.min}–${position.max}`;
  const statusLabel = (() => {
    if (isAbstain) return 'Abstained';
    if (selectedCount === 0) {
      return position.min > 0
        ? `${position.min} required`
        : 'No selection';
    }
    if (isSingle) return '1 selected';
    return `${selectedCount} selected`;
  })();
  const statusComplete =
    isAbstain ||
    (sel.kind === 'candidates' && sel.candidateIds.length >= position.min);

  return (
    <section>
      <div className="mb-6 border-b border-foreground/15 pb-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h2 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
              {position.name}
            </h2>
          </div>
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase whitespace-nowrap">
            {rule}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              'size-1.5 rounded-full',
              statusComplete ? 'bg-primary' : 'bg-muted-foreground/40',
            )}
            aria-hidden
          />
          <p
            className={cn(
              'text-xs tabular-nums',
              statusComplete ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {statusLabel}
          </p>
        </div>
      </div>

      {position.candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No candidates running for this position.
        </p>
      ) : isSingle ? (
        <RadioGroup
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          value={
            sel.kind === 'candidates' && sel.candidateIds[0]
              ? sel.candidateIds[0]
              : sel.kind === 'abstain'
                ? '__abstain'
                : ''
          }
          onValueChange={(value) => {
            if (value === '__abstain') {
              setChoice(position._id, { kind: 'abstain' });
            } else {
              setChoice(position._id, {
                kind: 'candidates',
                candidateIds: [value as Id<'candidates'>],
              });
            }
          }}
        >
          {position.candidates.map((candidate) => {
            const checked =
              sel.kind === 'candidates' &&
              sel.candidateIds[0] === candidate._id;
            return (
              <CandidateCard
                key={candidate._id}
                candidate={candidate}
                nameArrangement={nameArrangement}
                checked={checked}
                control={
                  <RadioGroupItem value={candidate._id} className="sr-only" />
                }
              />
            );
          })}
        </RadioGroup>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {position.candidates.map((candidate) => {
            const checked =
              sel.kind === 'candidates' &&
              sel.candidateIds.includes(candidate._id);
            return (
              <CandidateCard
                key={candidate._id}
                candidate={candidate}
                nameArrangement={nameArrangement}
                checked={checked}
                control={
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() =>
                      toggleCandidate(
                        position._id,
                        candidate._id,
                        position.max,
                      )
                    }
                    className="sr-only"
                  />
                }
              />
            );
          })}
        </div>
      )}

      {isSingle && position.min === 0 && (
        <button
          type="button"
          onClick={() => setChoice(position._id, { kind: 'abstain' })}
          className={cn(
            'mt-3 flex w-full items-center justify-between gap-3 rounded-md border bg-card px-4 py-3 text-sm transition-colors hover:border-foreground/30 hover:bg-accent/40',
            isAbstain && 'border-foreground bg-foreground/4',
          )}
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <MinusCircle className="size-4" aria-hidden />
            <span
              className={cn(
                'transition-colors',
                isAbstain && 'font-medium text-foreground',
              )}
            >
              Abstain from this position
            </span>
          </span>
          {isAbstain && (
            <span
              aria-hidden
              className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Check className="size-3" strokeWidth={3} />
            </span>
          )}
        </button>
      )}
    </section>
  );
}

function CandidateCard({
  candidate,
  nameArrangement,
  checked,
  control,
}: {
  candidate: {
    imageUrl: string | null;
    firstName: string;
    middleName?: string;
    lastName: string;
    partylistAcronym: string;
  };
  nameArrangement: number;
  checked: boolean;
  control: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        'group relative block cursor-pointer overflow-hidden rounded-md border bg-card transition-colors hover:border-foreground/30',
        checked && 'border-foreground',
      )}
    >
      {control}
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
        {checked && (
          <span
            aria-hidden
            className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
          >
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="border-t p-3">
        <p
          className={cn(
            'line-clamp-2 text-sm leading-snug text-balance',
            checked ? 'font-semibold text-foreground' : 'font-medium',
          )}
        >
          {formatName(nameArrangement, candidate)}
        </p>
        {candidate.partylistAcronym && (
          <p className="mt-1 text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase">
            {candidate.partylistAcronym}
          </p>
        )}
      </div>
    </label>
  );
}
