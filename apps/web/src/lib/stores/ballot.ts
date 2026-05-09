import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Id } from '@eboto/backend/data-model';

export type Choice =
  | { kind: 'abstain' }
  | { kind: 'candidates'; candidateIds: Id<'candidates'>[] };

type Ballot = Record<string, Choice>;

interface BallotState {
  ballots: Record<string, Ballot>;
  setChoice: (electionId: string, positionId: string, choice: Choice) => void;
  toggleCandidate: (
    electionId: string,
    positionId: string,
    candidateId: Id<'candidates'>,
    max: number,
  ) => void;
  clearBallot: (electionId: string) => void;
}

export const useBallotStore = create<BallotState>()(
  persist(
    (set) => ({
      ballots: {},
      setChoice: (electionId, positionId, choice) =>
        set((state) => ({
          ballots: {
            ...state.ballots,
            [electionId]: {
              ...(state.ballots[electionId] ?? {}),
              [positionId]: choice,
            },
          },
        })),
      toggleCandidate: (electionId, positionId, candidateId, max) =>
        set((state) => {
          const ballot = state.ballots[electionId] ?? {};
          const cur = ballot[positionId];
          const ids = cur?.kind === 'candidates' ? cur.candidateIds : [];
          const nextIds = ids.includes(candidateId)
            ? ids.filter((c) => c !== candidateId)
            : ids.length < max
              ? [...ids, candidateId]
              : ids;
          return {
            ballots: {
              ...state.ballots,
              [electionId]: {
                ...ballot,
                [positionId]: { kind: 'candidates', candidateIds: nextIds },
              },
            },
          };
        }),
      clearBallot: (electionId) =>
        set((state) => {
          if (!(electionId in state.ballots)) return state;
          const { [electionId]: _, ...rest } = state.ballots;
          return { ballots: rest };
        }),
    }),
    {
      name: 'eboto:ballots',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ ballots: state.ballots }),
    },
  ),
);
