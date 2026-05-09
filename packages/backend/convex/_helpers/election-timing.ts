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
 * NOTE: hour comparisons use the runtime's local time
 * (`new Date(t).getHours()`). On Convex this is UTC; in the browser this
 * is the user's local timezone. Existing call sites assumed local time, so
 * we preserve that behavior here. If/when elections grow timezone fields,
 * thread one through these helpers.
 */

export interface ElectionTiming {
  /** Calendar-start timestamp (ms). Conventionally midnight of the start day. */
  startDate: number;
  /** Calendar-end timestamp (ms). Conventionally midnight of the end day. */
  endDate: number;
  /** Inclusive voting window start hour, 0–23. */
  votingHourStart: number;
  /** Exclusive voting window end hour, 1–24. */
  votingHourEnd: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function nowMs(now?: number | Date): number {
  if (now === undefined) return Date.now();
  return typeof now === 'number' ? now : now.getTime();
}

/**
 * Today is within `[startDate, endDate]` (both calendar days inclusive).
 * `true` even at 7 AM on the start day if voting hours start at 8 AM —
 * the election period has begun but voting isn't open yet.
 */
export function isElectionInProgress(
  election: ElectionTiming,
  now?: number | Date,
): boolean {
  const t = nowMs(now);
  return t >= election.startDate && t < election.endDate + DAY_MS;
}

/**
 * Voting is currently being accepted. Both the calendar day and the
 * current hour must fall inside the election's window.
 *
 * Example with election `2026-01-01 → 2026-01-07`, `8 AM – 4 PM`:
 *   - `2026-01-01 07:00` → `false` (hour out of range)
 *   - `2026-01-01 08:00` → `true`
 *   - `2026-01-01 16:00` → `false` (end hour is exclusive)
 *   - `2026-01-02 07:00` → `false`
 *   - `2026-01-08 09:00` → `false` (date out of range)
 */
export function isVotingOpen(
  election: ElectionTiming,
  now?: number | Date,
): boolean {
  const t = nowMs(now);
  if (!isElectionInProgress(election, t)) return false;
  const hour = new Date(t).getHours();
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
  const t = nowMs(now);
  const closingMoment =
    election.endDate + election.votingHourEnd * HOUR_MS;
  return t > closingMoment;
}
