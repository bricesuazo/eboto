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
import { User } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@eboto/backend/api';
import type { Id } from '@eboto/backend/data-model';

import { PagePending } from '~/components/page-pending';
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
      <main className="container mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">You've already voted</h1>
        <p className="mt-2 text-muted-foreground">
          Each voter gets one ballot per election.
        </p>
        <Button
          render={
            <Link to="/$electionSlug" params={{ electionSlug: election.slug }}>
              Back to election
            </Link>
          }
          className="mt-6"
        />
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
          choice: selections[p._id]!,
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

  return (
    <main className="container mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold">{election.name}</h1>
      <p className="mt-1 text-muted-foreground">
        Cast your ballot. You can review your selections before submitting.
      </p>

      <div className="mt-10 space-y-12">
        {positions.map((position) => {
          const sel = selections[position._id]!;
          const isSingle = position.min === 0 && position.max === 1;

          return (
            <section key={position._id}>
              <h2 className="text-2xl font-semibold">{position.name}</h2>
              <p className="text-sm text-muted-foreground">
                {isSingle
                  ? 'Pick 1 candidate (or abstain)'
                  : `Pick ${position.min}–${position.max} candidate${position.max > 1 ? 's' : ''}`}
              </p>

              {position.candidates.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No candidates running for this position.
                </p>
              ) : isSingle ? (
                <RadioGroup
                  className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
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
                  {position.candidates.map((candidate) => (
                    <CandidateOption
                      key={candidate._id}
                      candidate={candidate}
                      nameArrangement={election.nameArrangement}
                      mode="radio"
                      value={candidate._id}
                    />
                  ))}
                  {position.min === 0 && (
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm',
                        sel.kind === 'abstain' && 'border-primary bg-primary/5',
                      )}
                    >
                      <RadioGroupItem value="__abstain" />
                      Abstain
                    </label>
                  )}
                </RadioGroup>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {position.candidates.map((candidate) => {
                    const checked =
                      sel.kind === 'candidates' &&
                      sel.candidateIds.includes(candidate._id);
                    return (
                      <label
                        key={candidate._id}
                        className={cn(
                          'flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3',
                          checked && 'border-primary bg-primary/5',
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() =>
                            toggleCandidate(
                              position._id,
                              candidate._id,
                              position.max,
                            )
                          }
                        />
                        <CandidatePreview
                          candidate={candidate}
                          nameArrangement={election.nameArrangement}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-12 flex justify-end gap-3">
        <Button
          render={
            <Link to="/$electionSlug" params={{ electionSlug: election.slug }}>
              Cancel
            </Link>
          }
          variant="outline"
        />
        <Button disabled={submitting} onClick={submit}>
          {submitting ? 'Submitting…' : 'Submit ballot'}
        </Button>
      </div>
    </main>
  );
}

function CandidatePreview({
  candidate,
  nameArrangement,
}: {
  candidate: {
    imageUrl: string | null;
    firstName: string;
    middleName?: string;
    lastName: string;
    partylistAcronym: string;
  };
  nameArrangement: number;
}) {
  return (
    <>
      <div className="relative size-16 overflow-hidden rounded-md bg-muted">
        {candidate.imageUrl ? (
          <img
            src={candidate.imageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <User className="absolute inset-0 m-auto size-8 text-muted-foreground" />
        )}
      </div>
      <span className="text-center text-xs">
        {formatName(nameArrangement, candidate)}{' '}
        {candidate.partylistAcronym && `(${candidate.partylistAcronym})`}
      </span>
    </>
  );
}

function CandidateOption({
  candidate,
  nameArrangement,
  mode,
  value,
}: {
  candidate: {
    imageUrl: string | null;
    firstName: string;
    middleName?: string;
    lastName: string;
    partylistAcronym: string;
  };
  nameArrangement: number;
  mode: 'radio';
  value: string;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3">
      <RadioGroupItem value={value} className="self-end" />
      <CandidatePreview
        candidate={candidate}
        nameArrangement={nameArrangement}
      />
    </label>
  );
}
