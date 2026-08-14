/**
 * Renders an election's change log — the public record of every edit made
 * after voting opened.
 *
 * One component serves both audiences. The public query already strips voter
 * identities before the data leaves the server (see `changeLogs.ts`), so a
 * `voter` entry simply arrives with `entityLabel: null` and `changes: null`
 * and renders as a count. Nothing here decides what may be shown; it only
 * displays what it was given.
 */
import dayjs from 'dayjs';
import {
  ArrowRight,
  ListRestart,
  PenLine,
  Plus,
  ScrollText,
  Trash2,
} from 'lucide-react';

import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';

type Entity =
  | 'election'
  | 'position'
  | 'partylist'
  | 'candidate'
  | 'voter'
  | 'voterField';
type Action = 'create' | 'update' | 'delete' | 'reorder';

export interface ChangeLogEntry {
  _id: string;
  at: number;
  actorName: string;
  actorEmail?: string | null;
  entity: Entity;
  entityLabel: string | null;
  action: Action;
  changes:
    | { field: string; label: string; before: string; after: string }[]
    | null;
  reason: string;
  count: number | null;
}

const ENTITY_LABELS: Record<Entity, string> = {
  election: 'Election settings',
  position: 'Position',
  partylist: 'Partylist',
  candidate: 'Candidate',
  voter: 'Voter list',
  voterField: 'Voter field',
};

const ACTION_ICONS: Record<Action, typeof PenLine> = {
  create: Plus,
  update: PenLine,
  delete: Trash2,
  reorder: ListRestart,
};

const ACTION_TONES: Record<Action, string> = {
  create:
    'border-emerald-300/60 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300',
  update:
    'border-amber-300/60 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300',
  delete:
    'border-red-300/60 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300',
  reorder:
    'border-sky-300/60 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300',
};

/**
 * Headline for one entry. Voter rows are pluralised from `count` because
 * their label is withheld from public viewers — "3 voters added" carries the
 * integrity signal without naming anyone.
 */
function headline(entry: ChangeLogEntry): string {
  const kind = ENTITY_LABELS[entry.entity];

  if (entry.entity === 'voter' && entry.entityLabel === null) {
    const n = entry.count ?? 1;
    const noun = n === 1 ? 'voter' : 'voters';
    if (entry.action === 'create') return `${n} ${noun} added`;
    if (entry.action === 'delete') return `${n} ${noun} removed`;
    return `${n} ${noun} updated`;
  }

  const label = entry.entityLabel ? ` — ${entry.entityLabel}` : '';
  switch (entry.action) {
    case 'create':
      return `${kind} added${label}`;
    case 'delete':
      return `${kind} removed${label}`;
    case 'reorder':
      return `${kind} order changed`;
    default:
      return `${kind} edited${label}`;
  }
}

export function ChangeLogList({
  entries,
  className,
}: {
  entries: ChangeLogEntry[];
  className?: string;
}) {
  if (entries.length === 0) return <ChangeLogEmpty className={className} />;

  return (
    <ol className={cn('space-y-3', className)}>
      {entries.map((entry) => {
        const Icon = ACTION_ICONS[entry.action];
        return (
          <li
            key={entry._id}
            className="rounded-lg border bg-card p-4 text-sm shadow-xs"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={cn(
                  'inline-flex size-6 shrink-0 items-center justify-center rounded-full border',
                  ACTION_TONES[entry.action],
                )}
                aria-hidden
              >
                <Icon className="size-3" />
              </span>
              <span className="font-medium">{headline(entry)}</span>
              <Badge variant="outline" className="ml-auto shrink-0 font-normal">
                <time dateTime={new Date(entry.at).toISOString()}>
                  {dayjs(entry.at).format('MMM D, YYYY · h:mm A')}
                </time>
              </Badge>
            </div>

            {entry.changes && entry.changes.length > 0 && (
              <dl className="mt-3 space-y-1.5 border-l-2 pl-3">
                {entry.changes.map((change) => (
                  <div
                    key={change.field}
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
                  >
                    <dt className="text-xs font-medium text-muted-foreground uppercase">
                      {change.label}
                    </dt>
                    <dd className="flex flex-wrap items-baseline gap-1.5">
                      <span className="text-muted-foreground line-through decoration-muted-foreground/50">
                        {change.before}
                      </span>
                      <ArrowRight
                        className="size-3 shrink-0 self-center text-muted-foreground"
                        aria-hidden
                      />
                      <span className="font-medium">{change.after}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            <p className="mt-3 text-muted-foreground italic">
              &ldquo;{entry.reason}&rdquo;
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              by {entry.actorName}
              {entry.actorEmail ? ` · ${entry.actorEmail}` : ''}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function ChangeLogEmpty({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-dashed px-6 py-10 text-center',
        className,
      )}
    >
      <ScrollText
        className="mx-auto size-6 text-muted-foreground"
        aria-hidden
      />
      <p className="mt-3 text-sm font-medium">No changes since voting opened</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Nothing about this election has been edited since the ballot went live.
      </p>
    </div>
  );
}
