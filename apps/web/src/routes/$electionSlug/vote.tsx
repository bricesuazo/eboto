import { useState } from 'react';
import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
} from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { api } from '@eboto/backend/api';
import type { Id } from '@eboto/backend/data-model';
import { toast } from 'sonner';
import { User } from 'lucide-react';

import { PagePending } from '~/components/page-pending';
import { CONVEX_ERROR_NOT_FOUND } from '~/lib/constants';
import { formatName } from '~/lib/election';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { cn } from '~/lib/utils';

export const Route = createFileRoute('/$electionSlug/vote')({
  beforeLoad: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(
        convexQuery(api.votes.getVotingPage, { slug: params.electionSlug }),
      );
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { code?: string; message?: string };
        if (data.code === CONVEX_ERROR_NOT_FOUND) throw notFound();
      }
      throw err;
    }
  },
  pendingComponent: PagePending,
  component: BallotPage,
});

type Choice =
  | { kind: 'abstain' }
  | { kind: 'candidates'; candidateIds: Id<'candidates'>[] };

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

  const [selections, setSelections] = useState<Record<string, Choice>>(() => {
    const init: Record<string, Choice> = {};
    for (const p of positions) {
      init[p._id] =
        p.min === 0 && p.max === 1
          ? { kind: 'abstain' }
          : { kind: 'candidates', candidateIds: [] };
    }
    return init;
  });
  const [submitting, setSubmitting] = useState(false);

  if (hasVoted) {
    return (
      <main className="container mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">You've already voted</h1>
        <p className="text-muted-foreground mt-2">
          Each voter gets one ballot per election.
        </p>
        <Button asChild className="mt-6">
          <Link
            to="/$electionSlug"
            params={{ electionSlug: election.slug }}
          >
            Back to election
          </Link>
        </Button>
      </main>
    );
  }

  function setChoice(positionId: string, choice: Choice) {
    setSelections((prev) => ({ ...prev, [positionId]: choice }));
  }

  function toggleCandidate(
    positionId: string,
    candidateId: Id<'candidates'>,
    max: number,
  ) {
    setSelections((prev) => {
      const cur = prev[positionId];
      const ids =
        cur && cur.kind === 'candidates' ? cur.candidateIds : [];
      const next = ids.includes(candidateId)
        ? ids.filter((c) => c !== candidateId)
        : ids.length < max
          ? [...ids, candidateId]
          : ids;
      return {
        ...prev,
        [positionId]: { kind: 'candidates', candidateIds: next },
      };
    });
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
      toast.success('Ballot submitted!');
      navigate({
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
      <p className="text-muted-foreground mt-1">
        Cast your ballot. You can review your selections before submitting.
      </p>

      <div className="mt-10 space-y-12">
        {positions.map((position) => {
          const sel = selections[position._id]!;
          const isSingle = position.min === 0 && position.max === 1;

          return (
            <section key={position._id}>
              <h2 className="text-2xl font-semibold">{position.name}</h2>
              <p className="text-muted-foreground text-sm">
                {isSingle
                  ? 'Pick 1 candidate (or abstain)'
                  : `Pick ${position.min}–${position.max} candidate${position.max > 1 ? 's' : ''}`}
              </p>

              {position.candidates.length === 0 ? (
                <p className="text-muted-foreground mt-3 text-sm">
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
                        sel.kind === 'abstain' &&
                          'border-primary bg-primary/5',
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
        <Button asChild variant="outline">
          <Link
            to="/$electionSlug"
            params={{ electionSlug: election.slug }}
          >
            Cancel
          </Link>
        </Button>
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
      <div className="bg-muted relative size-16 overflow-hidden rounded-md">
        {candidate.imageUrl ? (
          <img
            src={candidate.imageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <User className="text-muted-foreground absolute inset-0 m-auto size-8" />
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
      <CandidatePreview candidate={candidate} nameArrangement={nameArrangement} />
    </label>
  );
}
