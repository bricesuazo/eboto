/**
 * Writer + formatting helpers for `electionChangeLogs`.
 *
 * Once voting opens, a commissioner may still fix mistakes — but every such
 * edit is published. Mutations that can run post-start call
 * {@link recordElectionChange} in the same transaction as their write, so a
 * change and its log entry either both land or neither does.
 *
 * Diffs are rendered to strings here rather than at read time because the
 * values that need context (dates, hours) are only meaningful in the
 * election's own timezone, and a `before` value is gone from the DB by the
 * time anyone reads the log.
 */
import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { ChangeLogAction, ChangeLogEntity } from '../schema';
import { DEFAULT_TIMEZONE } from './election_timing';

export interface FieldChange {
  /** Machine name of the field, for future filtering. */
  field: string;
  /** Label as shown to viewers. */
  label: string;
  before: string;
  after: string;
}

/** Placeholder used on both sides of a diff so "was empty" reads clearly. */
const EMPTY = '—';

/**
 * Default renderer: nullish and empty-string collapse to the same value, so
 * `undefined` → `''` isn't reported as a change.
 *
 * Only handles the scalar field types the schema actually stores. Anything
 * else needs its own `format` on the {@link FieldSpec} — an object rendered
 * as `[object Object]` would silently swallow a real change.
 */
export function formatValue(value: unknown): string {
  if (value === undefined || value === null) return EMPTY;
  if (
    typeof value !== 'string' &&
    typeof value !== 'number' &&
    typeof value !== 'boolean'
  ) {
    return EMPTY;
  }
  const text = String(value).trim();
  return text === '' ? EMPTY : text;
}

export function formatToggle(value: unknown): string {
  return value ? 'On' : 'Off';
}

/** 12-hour clock label for a 0–24 hour slot. Matches the web app's
 *  `parseHourTo12HourFormat` so the log reads like the rest of the UI. */
export function formatHour(value: unknown): string {
  const hour = Number(value);
  if (!Number.isFinite(hour)) return EMPTY;
  if (hour === 0 || hour === 24) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

/** Publicity levels, worded as the settings form words them. */
export function formatPublicity(value: unknown): string {
  switch (value) {
    case 'PRIVATE':
      return 'Private — commissioners only';
    case 'VOTER':
      return 'Voter — registered voters only';
    case 'PUBLIC':
      return 'Public — anyone can view';
    default:
      return formatValue(value);
  }
}

/** The two candidate-name arrangements (`nameArrangement` 0 and 1). */
export function formatNameArrangement(value: unknown): string {
  if (Number(value) === 0) return 'First Middle Last';
  if (Number(value) === 1) return 'Last, First Middle';
  return formatValue(value);
}

/**
 * Renders a stored calendar-day marker as `MMM D, YYYY`. The markers are
 * UTC-midnight of the intended day (see `election_timing.ts`), so the date is
 * read back with the UTC getters — using local getters would shift the day.
 */
export function formatDay(value: unknown): string {
  const ms = Number(value);
  if (!Number.isFinite(ms)) return EMPTY;
  const date = new Date(ms);
  const month = date.toLocaleString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  });
  return `${month} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function formatTimezone(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : '';
  return (text || DEFAULT_TIMEZONE).replace(/_/g, ' ');
}

/** Renders a voter's custom-field blob as `key: value` pairs, sorted so an
 *  unchanged blob never diffs just because key order moved. */
export function formatFieldBlob(value: unknown): string {
  if (!value || typeof value !== 'object') return EMPTY;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}: ${String(v)}`);
  return entries.length === 0 ? EMPTY : entries.join(', ');
}

export interface FieldSpec {
  key: string;
  label: string;
  /** Renders both display text and the equality basis — two values that
   *  format identically are not a change. */
  format?: (value: unknown) => string;
}

/**
 * Compares the `specs` fields between two shallow records and returns one
 * entry per field whose rendered value actually moved. Fields absent from
 * `after` are skipped, so a partial patch only diffs what it touches.
 */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  specs: FieldSpec[],
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const spec of specs) {
    if (!(spec.key in after)) continue;
    const render = spec.format ?? formatValue;
    const from = render(before[spec.key]);
    const to = render(after[spec.key]);
    if (from === to) continue;
    changes.push({
      field: spec.key,
      label: spec.label,
      before: from,
      after: to,
    });
  }
  return changes;
}

/** Convenience for one-off diffs that don't come from a document pair. */
export function fieldChange(
  field: string,
  label: string,
  before: string,
  after: string,
): FieldChange[] {
  return before === after ? [] : [{ field, label, before, after }];
}

/** Full name for log labels. Deliberately arrangement-independent — the log
 *  identifies a person, it isn't ballot display. */
export function candidateLabel(candidate: {
  firstName: string;
  middleName?: string;
  lastName: string;
}): string {
  return [candidate.firstName, candidate.middleName, candidate.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
}

async function resolveActor(ctx: MutationCtx, userId: Id<'users'> | undefined) {
  if (!userId) return { actorName: 'System', actorEmail: undefined };
  const user = await ctx.db.get(userId);
  const name = user?.name?.trim() ?? '';
  return {
    // Never fall back to the email here: `actorName` is published, and a
    // commissioner who hasn't set a display name shouldn't have their
    // address exposed as a side effect. The address is kept in
    // `actorEmail`, which only the commissioner-facing query returns.
    actorName: name === '' ? 'Election commissioner' : name,
    actorEmail: user?.email ?? undefined,
  };
}

export interface RecordChangeArgs {
  electionId: Id<'elections'>;
  /** The commissioner who made the change. Omit for system-initiated writes. */
  actorUserId?: Id<'users'>;
  entity: ChangeLogEntity;
  entityId?: string;
  entityLabel: string;
  action: ChangeLogAction;
  changes?: FieldChange[];
  reason: string;
  count?: number;
}

/**
 * Appends one entry to the election's public change log.
 *
 * Call this only for post-start changes — see the `electionChangeLogs` note
 * in `schema.ts` for why pre-start setup is not recorded.
 */
export async function recordElectionChange(
  ctx: MutationCtx,
  args: RecordChangeArgs,
): Promise<void> {
  const { actorName, actorEmail } = await resolveActor(ctx, args.actorUserId);
  await ctx.db.insert('electionChangeLogs', {
    electionId: args.electionId,
    actorUserId: args.actorUserId,
    actorName,
    actorEmail,
    entity: args.entity,
    entityId: args.entityId,
    entityLabel: args.entityLabel,
    action: args.action,
    changes: args.changes && args.changes.length > 0 ? args.changes : undefined,
    reason: args.reason,
    count: args.count,
  });
}
