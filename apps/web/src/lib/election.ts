import { add, getHours, isAfter, isWithinInterval, sub } from 'date-fns';

interface ElectionTiming {
  startDate: number;
  endDate: number;
  votingHourStart: number;
  votingHourEnd: number;
}

export function isElectionEnded(election: ElectionTiming) {
  const now = new Date();
  return isAfter(
    now,
    add(election.endDate, { hours: election.votingHourEnd }),
  );
}

export function isElectionOngoing(
  election: ElectionTiming,
  opts: { withoutHours?: boolean } = {},
) {
  const now = new Date();
  const within = isWithinInterval(now, {
    start: election.startDate,
    end: sub(add(election.endDate, { days: 1 }), { seconds: 1 }),
  });
  if (opts.withoutHours) return within;
  return (
    within &&
    getHours(now) >= election.votingHourStart &&
    getHours(now) < election.votingHourEnd
  );
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
