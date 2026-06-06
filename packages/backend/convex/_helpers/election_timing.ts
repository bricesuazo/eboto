/**
 * Shared election-timing helpers, usable from both Convex queries/mutations
 * and the web app. Pure functions, no Convex or Node-specific imports.
 *
 * Two distinct notions of "ongoing":
 *  - {@link isElectionInProgress} — date-range only ("the election period
 *    has started but not yet finished"). Independent of daily voting hours.
 *  - {@link isVotingOpen} — date AND current hour both inside the election's
 *    daily voting window. Use this to gate the actual vote action.
 *
 * Plus {@link isElectionEnded} for "fully concluded" (past the closing hour
 * on the last day).
 *
 * TIMEZONE: every comparison is done in the election's own `timezone` (an
 * IANA name like "Asia/Manila"), not the runtime's local time. `startDate`
 * and `endDate` are stored as the UTC-midnight marker of a calendar day, so
 * the intended Y-M-D is read back with the UTC getters and then re-anchored
 * to the election timezone via `Intl`. An absent `timezone` falls back to
 * {@link DEFAULT_TIMEZONE} so legacy rows keep working. This uses only the
 * built-in `Intl` API, so it runs identically in Convex's V8 runtime and the
 * browser with no dependency.
 */

/** Fallback timezone for elections created before the field existed. */
export const DEFAULT_TIMEZONE = 'Asia/Manila';

export interface ElectionTiming {
  /** Calendar-start timestamp (ms). Conventionally UTC-midnight of the start day. */
  startDate: number;
  /** Calendar-end timestamp (ms). Conventionally UTC-midnight of the end day. */
  endDate: number;
  /** Inclusive voting window start hour, 0–23. */
  votingHourStart: number;
  /** Exclusive voting window end hour, 1–24. */
  votingHourEnd: number;
  /** IANA timezone the dates and hours are interpreted in. `null`/absent
   *  falls back to {@link DEFAULT_TIMEZONE}. */
  timezone?: string | null;
}

const HOUR_MS = 60 * 60 * 1000;

function nowMs(now?: number | Date): number {
  if (now === undefined) return Date.now();
  return typeof now === 'number' ? now : now.getTime();
}

function timezoneOf(election: ElectionTiming): string {
  return election.timezone ?? DEFAULT_TIMEZONE;
}

interface WallClock {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number; // 0–23
  minute: number;
  second: number;
}

/** Wall-clock parts of an absolute instant as observed in `timezone`. */
function partsInZone(instant: number, timezone: string): WallClock {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const map = new Map<string, number>();
  for (const part of dtf.formatToParts(new Date(instant))) {
    if (part.type !== 'literal') map.set(part.type, Number(part.value));
  }
  const get = (type: string) => map.get(type) ?? 0;
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    // `hourCycle: 'h23'` still renders midnight as "24" in some engines.
    hour: get('hour') % 24,
    minute: get('minute'),
    second: get('second'),
  };
}

/** The UTC calendar Y-M-D encoded by a stored midnight-marker timestamp. */
function calendarDay(dateMs: number): { year: number; month: number; day: number } {
  const d = new Date(dateMs);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

/** Offset (ms) of `timezone` at a given instant: zonedWallClock − instant. */
function offsetMsAt(instant: number, timezone: string): number {
  const p = partsInZone(instant, timezone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - instant;
}

/**
 * Absolute instant (ms) when the wall-clock `year-month-day hour:00` occurs in
 * `timezone`. Resolves the offset by guessing in UTC and correcting once for
 * the offset at the resulting instant (handles standard/DST transitions).
 */
function zonedTimeToInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  timezone: string,
): number {
  const utcGuess = Date.UTC(year, month - 1, day, hour, 0, 0);
  const offset1 = offsetMsAt(utcGuess, timezone);
  let instant = utcGuess - offset1;
  const offset2 = offsetMsAt(instant, timezone);
  if (offset2 !== offset1) instant = utcGuess - offset2;
  return instant;
}

function dayNumber(d: { year: number; month: number; day: number }): number {
  return d.year * 10000 + d.month * 100 + d.day;
}

/**
 * Today (in the election's timezone) is within `[startDate, endDate]` (both
 * calendar days inclusive). `true` even at 7 AM on the start day if voting
 * hours start at 8 AM — the election period has begun but voting isn't open.
 */
export function isElectionInProgress(
  election: ElectionTiming,
  now?: number | Date,
): boolean {
  const tz = timezoneOf(election);
  const today = dayNumber(partsInZone(nowMs(now), tz));
  return (
    today >= dayNumber(calendarDay(election.startDate)) &&
    today <= dayNumber(calendarDay(election.endDate))
  );
}

/**
 * Voting is currently being accepted. Both the calendar day and the current
 * hour (in the election's timezone) must fall inside the window.
 *
 * Example with election `2026-01-01 → 2026-01-07`, `8 AM – 4 PM`, Asia/Manila:
 *   - `2026-01-01 07:00 +08` → `false` (hour out of range)
 *   - `2026-01-01 08:00 +08` → `true`
 *   - `2026-01-01 16:00 +08` → `false` (end hour is exclusive)
 *   - `2026-01-02 07:00 +08` → `false`
 *   - `2026-01-08 09:00 +08` → `false` (date out of range)
 */
export function isVotingOpen(
  election: ElectionTiming,
  now?: number | Date,
): boolean {
  const t = nowMs(now);
  if (!isElectionInProgress(election, t)) return false;
  const hour = partsInZone(t, timezoneOf(election)).hour;
  return hour >= election.votingHourStart && hour < election.votingHourEnd;
}

/**
 * The election has fully concluded — past the closing hour on the end day.
 * After this, the election can be considered final and historical.
 */
export function isElectionEnded(
  election: ElectionTiming,
  now?: number | Date,
): boolean {
  return nowMs(now) > votingEndAt(election);
}

/**
 * Absolute unix-ms moment voting opens (start day + opening hour, in the
 * election's timezone). Use this to schedule "election started" side-effects.
 */
export function votingStartAt(election: ElectionTiming): number {
  const { year, month, day } = calendarDay(election.startDate);
  return zonedTimeToInstant(
    year,
    month,
    day,
    election.votingHourStart,
    timezoneOf(election),
  );
}

/**
 * Absolute unix-ms moment voting closes (end day + closing hour, in the
 * election's timezone). Use this to schedule "election ended" side-effects.
 *
 * `votingHourEnd` may be 24 (midnight of the following day); `Date.UTC`
 * normalizes the rollover, and `zonedTimeToInstant` resolves the offset at
 * the actual instant, so this stays correct.
 */
export function votingEndAt(election: ElectionTiming): number {
  const { year, month, day } = calendarDay(election.endDate);
  return zonedTimeToInstant(
    year,
    month,
    day,
    election.votingHourEnd,
    timezoneOf(election),
  );
}

// Retained for callers that previously relied on the module-level constant.
export const ELECTION_DAY_MS = 24 * HOUR_MS;
