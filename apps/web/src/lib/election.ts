import type { ElectionTiming } from '@eboto/backend/election-timing';
import {
  isElectionEnded as isElectionEndedShared,
  isElectionInProgress,
  isVotingOpen,
} from '@eboto/backend/election-timing';
import dayjs from 'dayjs';

// Re-export the shared helpers so existing imports from `~/lib/election`
// keep working. The single source of truth lives in
// `@eboto/backend/election-timing` and is shared between the web app and
// Convex.
export {
  isElectionEndedShared as isElectionEnded,
  isElectionInProgress,
  isVotingOpen,
};
export type { ElectionTiming };

/**
 * Backward-compatible wrapper: existing call sites use this name. With no
 * options it returns whether voting is currently open (date + hour). With
 * `{ withoutHours: true }` it returns whether the election period is in
 * progress (date only).
 */
export function isElectionOngoing(
  election: ElectionTiming,
  opts: { withoutHours?: boolean } = {},
): boolean {
  // Locally retype the cross-package imports so the eslint type-resolver
  // doesn't see them as `error`/`any` — `@eboto/backend/election-timing`
  // points at a `.ts` source file and the type-aware lint rules sometimes
  // give up on it.
  const inProgress = isElectionInProgress as (e: ElectionTiming) => boolean;
  const open = isVotingOpen as (e: ElectionTiming) => boolean;
  return opts.withoutHours ? inProgress(election) : open(election);
}

export function parseHourTo12HourFormat(hour: number) {
  if (hour === 0 || hour === 24) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

interface CandidateName {
  firstName: string;
  middleName?: string;
  lastName: string;
}

export function formatName(
  arrangement: number,
  candidate: CandidateName,
  isMiddleInitialOnly?: boolean,
) {
  const middle = candidate.middleName
    ? isMiddleInitialOnly
      ? candidate.middleName.charAt(0) + '.'
      : candidate.middleName
    : null;

  if (arrangement === 0) {
    return `${candidate.firstName}${middle ? ' ' + middle : ''} ${candidate.lastName}`;
  }
  if (arrangement === 1) {
    return `${candidate.lastName}, ${candidate.firstName}${candidate.middleName ? ' ' + candidate.middleName : ''}`;
  }
  return 'No name';
}

/**
 * Credential year fields are stored as strings but legacy/imported rows
 * occasionally have empty or unparseable values. Returns the `YYYY` form
 * or `null` so callers can omit the year entirely.
 */
export function formatYear(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY') : null;
}

export function describePublicity(publicity: 'PRIVATE' | 'VOTER' | 'PUBLIC') {
  switch (publicity) {
    case 'PRIVATE':
      return 'Only commissioners can see this election';
    case 'VOTER':
      return 'Only voters and commissioners can see this election';
    case 'PUBLIC':
      return 'Everyone can see this election';
  }
}
