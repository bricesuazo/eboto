import { useEffect, useMemo, useRef, useState } from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useConvex, useMutation, usePaginatedQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import {
  CheckCircle2,
  Circle,
  Download,
  Info,
  Loader2,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@eboto/backend/api';
import type { Doc, Id } from '@eboto/backend/data-model';
import type { VoterFieldType } from '@eboto/backend/schema';

import { DashboardPending } from '~/components/dashboard-pending';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import {
  FIELD_TYPES,
  htmlInputTypeFor,
  isVoterFieldType,
  SAMPLE_VOTER_EMAILS,
  sampleValueForType,
  validateFieldValue,
} from '~/lib/voter-fields';

export const Route = createFileRoute(
  '/dashboard/$electionDashboardSlug/voter/',
)({
  beforeLoad: async ({ context, params }) => {
    const election = await context.queryClient.ensureQueryData(
      convexQuery(api.elections.getDashboardBySlug, {
        slug: params.electionDashboardSlug,
      }),
    );
    if (!election) throw notFound();
    await Promise.all([
      context.queryClient.ensureQueryData(
        convexQuery(api.voters.stats, { electionId: election._id }),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.voterFields.list, { electionId: election._id }),
      ),
    ]);
  },
  head: ({ params }) => ({
    meta: [{ title: `${params.electionDashboardSlug} · Voters | eBoto` }],
  }),
  pendingComponent: DashboardPending,
  component: VoterPage,
});

type StatusFilter = 'all' | 'voted' | 'pending';

function VoterPage() {
  const { electionDashboardSlug } = Route.useParams();
  const { data: election } = useQuery(
    convexQuery(api.elections.getDashboardBySlug, {
      slug: electionDashboardSlug,
    }),
  );
  if (!election) throw notFound();

  const { data: stats } = useQuery(
    convexQuery(api.voters.stats, { electionId: election._id }),
  );
  const { data: voterFields = [] } = useQuery(
    convexQuery(api.voterFields.list, { electionId: election._id }),
  );

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const {
    results,
    status: pageStatus,
    loadMore,
  } = usePaginatedQuery(
    api.voters.listPaginated,
    {
      electionId: election._id,
      search: debouncedSearch || undefined,
      status: debouncedSearch ? undefined : status,
    },
    { initialNumItems: 50 },
  );

  const total = stats?.total ?? 0;
  const totalVoted = stats?.voted ?? 0;
  const totalPending = stats?.pending ?? 0;
  const turnoutPct = total === 0 ? 0 : Math.round((totalVoted / total) * 100);

  const columns = useMemo(
    () =>
      [
        'minmax(220px, 1.6fr)',
        ...voterFields.map(() => 'minmax(120px, 1fr)'),
        '120px',
        '88px',
      ].join(' '),
    [voterFields],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Voters</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">{total}</span>{' '}
              registered
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span>
              <span className="font-medium text-foreground">{totalVoted}</span>{' '}
              voted
            </span>
            <Badge variant="secondary" className="font-medium">
              {turnoutPct}% turnout
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ManageFieldsDialog electionId={election._id} fields={voterFields} />
          <ExportVotersButton
            electionId={election._id}
            slug={election.slug}
            fields={voterFields}
          />
          <Button
            variant="outline"
            render={
              <Link
                to="/dashboard/$electionDashboardSlug/voter/import"
                params={{ electionDashboardSlug }}
              />
            }
          >
            <Upload className="size-4" /> Bulk import
          </Button>
          <SingleAddDialog electionId={election._id} fields={voterFields} />
        </div>
      </div>

      {total === 0 && pageStatus !== 'LoadingFirstPage' ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>No voters yet</EmptyTitle>
            <EmptyDescription>
              Add voters individually or bulk import a CSV to get started.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Tabs
              value={debouncedSearch ? 'all' : status}
              onValueChange={(v) => setStatus(v as StatusFilter)}
            >
              <TabsList>
                <TabsTrigger value="all" disabled={!!debouncedSearch}>
                  All
                  <span className="ml-1 text-xs text-muted-foreground">
                    {total}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="voted" disabled={!!debouncedSearch}>
                  Voted
                  <span className="ml-1 text-xs text-muted-foreground">
                    {totalVoted}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="pending" disabled={!!debouncedSearch}>
                  Pending
                  <span className="ml-1 text-xs text-muted-foreground">
                    {totalPending}
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <VoterList
            results={results}
            fields={voterFields}
            columns={columns}
            pageStatus={pageStatus}
            loadMore={loadMore}
            onClearFilters={() => {
              setSearch('');
              setStatus('all');
            }}
            hasActiveFilter={!!debouncedSearch || status !== 'all'}
          />
        </Card>
      )}
    </div>
  );
}

const ROW_HEIGHT = 48;

function VoterList({
  results,
  fields,
  columns,
  pageStatus,
  loadMore,
  onClearFilters,
  hasActiveFilter,
}: {
  results: Doc<'voters'>[];
  fields: Doc<'voter_fields'>[];
  columns: string;
  pageStatus: 'LoadingFirstPage' | 'LoadingMore' | 'CanLoadMore' | 'Exhausted';
  loadMore: (n: number) => void;
  onClearFilters: () => void;
  hasActiveFilter: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const last = virtualItems[virtualItems.length - 1];
  useEffect(() => {
    if (
      last &&
      pageStatus === 'CanLoadMore' &&
      last.index >= results.length - 15
    ) {
      loadMore(50);
    }
  }, [last, pageStatus, loadMore, results.length]);

  if (pageStatus === 'LoadingFirstPage' && results.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading voters…
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-12 text-center text-sm text-muted-foreground">
        <p>No voters match your filters.</p>
        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="max-h-[640px] overflow-auto">
      <div className="min-w-max">
        <div
          className="sticky top-0 z-10 grid border-b bg-background text-xs font-medium text-muted-foreground"
          style={{ gridTemplateColumns: columns }}
        >
          <div className="px-3 py-2">Email</div>
          {fields.map((f) => (
            <div key={f._id} className="px-3 py-2">
              {f.name}
            </div>
          ))}
          <div className="px-3 py-2">Status</div>
          <div className="px-3 py-2 text-right">
            <span className="sr-only">Actions</span>
          </div>
        </div>

        <div
          className="relative"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualItems.map((vi) => {
            const voter = results[vi.index];
            if (!voter) return null;
            return (
              <div
                key={voter._id}
                data-index={vi.index}
                className="absolute inset-x-0 grid items-center border-b text-sm hover:bg-muted/40"
                style={{
                  transform: `translateY(${vi.start}px)`,
                  height: vi.size,
                  gridTemplateColumns: columns,
                }}
              >
                <VoterRow voter={voter} fields={fields} />
              </div>
            );
          })}
        </div>

        {pageStatus === 'LoadingMore' && (
          <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Loading more…
          </div>
        )}
      </div>
    </div>
  );
}

function VoterRow({
  voter,
  fields,
}: {
  voter: Doc<'voters'>;
  fields: Doc<'voter_fields'>[];
}) {
  const hasVoted = !!voter.votedAt;
  const fieldData =
    voter.field && typeof voter.field === 'object'
      ? (voter.field as Record<string, unknown>)
      : {};
  return (
    <>
      <div className="truncate px-3 font-mono text-xs">{voter.email}</div>
      {fields.map((f) => {
        const raw = fieldData[f.name];
        const display =
          raw == null || raw === ''
            ? null
            : typeof raw === 'string' ||
                typeof raw === 'number' ||
                typeof raw === 'boolean'
              ? String(raw)
              : null;
        return (
          <div
            key={f._id}
            className="truncate px-3 text-xs text-muted-foreground"
          >
            {display ?? <span className="text-muted-foreground/40">—</span>}
          </div>
        );
      })}
      <div className="px-3">
        {hasVoted ? (
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          >
            <CheckCircle2 className="size-3" />
            Voted
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            <Circle className="size-3" />
            Pending
          </Badge>
        )}
      </div>
      <div className="flex justify-end gap-0.5 px-3">
        <EditVoterDialog voter={voter} fields={fields} />
        {!hasVoted && <DeleteVoterButton id={voter._id} />}
      </div>
    </>
  );
}

function VoterFieldLabel({
  htmlFor,
  field,
}: {
  htmlFor: string;
  field: Doc<'voter_fields'>;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>
        {field.name} <span className="text-muted-foreground">(optional)</span>
      </Label>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label={`${field.name} field type`}
              className="text-muted-foreground hover:text-foreground"
            >
              <Info className="size-3.5" />
            </button>
          }
        />
        <TooltipContent>
          Type: <span className="font-mono uppercase">{field.type}</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function SingleAddDialog({
  electionId,
  fields,
}: {
  electionId: Doc<'elections'>['_id'];
  fields: Doc<'voter_fields'>[];
}) {
  const create = useMutation(api.voters.create);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fieldErrors: Record<string, string | null> = {};
  for (const f of fields) {
    fieldErrors[f._id] = validateFieldValue(f.type, fieldValues[f.name] ?? '');
  }
  const hasFieldErrors = Object.values(fieldErrors).some((e) => e !== null);

  const reset = () => {
    setEmail('');
    setFieldValues({});
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" /> Add voter
          </Button>
        }
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a voter</DialogTitle>
          <DialogDescription>
            They'll be able to sign in with this email and cast a ballot.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            try {
              const trimmed: Record<string, string> = {};
              for (const f of fields) {
                const value = fieldValues[f.name]?.trim();
                if (value) trimmed[f.name] = value;
              }
              await create({
                electionId,
                email,
                ...(Object.keys(trimmed).length > 0 ? { fields: trimmed } : {}),
              });
              toast.success('Voter added');
              reset();
              setOpen(false);
            } catch (err) {
              toast.error(
                err instanceof ConvexError
                  ? ((err.data as { message?: string }).message ?? 'Failed')
                  : 'Failed',
              );
            } finally {
              setSubmitting(false);
            }
          }}
          className="space-y-3"
        >
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={SAMPLE_VOTER_EMAILS[0]}
            />
          </div>

          {fields.length > 0 && (
            <div className="space-y-3 border-t pt-3">
              {fields.map((f) => {
                const id = `voter-field-${f._id}`;
                const error = fieldErrors[f._id];
                if (f.type === 'boolean') {
                  return (
                    <div key={f._id} className="space-y-1">
                      <VoterFieldLabel htmlFor={id} field={f} />
                      <Select
                        value={fieldValues[f.name] ?? ''}
                        onValueChange={(v) =>
                          setFieldValues((s) => ({ ...s, [f.name]: v ?? '' }))
                        }
                      >
                        <SelectTrigger id={id}>
                          <SelectValue placeholder="true" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">true</SelectItem>
                          <SelectItem value="false">false</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
                return (
                  <div key={f._id} className="space-y-1">
                    <VoterFieldLabel htmlFor={id} field={f} />
                    <Input
                      id={id}
                      type={htmlInputTypeFor(f.type)}
                      value={fieldValues[f.name] ?? ''}
                      placeholder={sampleValueForType(f.type, 0)}
                      aria-invalid={error ? true : undefined}
                      onChange={(e) =>
                        setFieldValues((s) => ({
                          ...s,
                          [f.name]: e.target.value,
                        }))
                      }
                    />
                    {error && (
                      <p className="text-xs text-destructive">{error}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || hasFieldErrors}>
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditVoterDialog({
  voter,
  fields,
}: {
  voter: Doc<'voters'>;
  fields: Doc<'voter_fields'>[];
}) {
  const update = useMutation(api.voters.update);
  const [open, setOpen] = useState(false);
  const initialFieldValues = (): Record<string, string> => {
    const data =
      voter.field && typeof voter.field === 'object'
        ? (voter.field as Record<string, unknown>)
        : {};
    const result: Record<string, string> = {};
    for (const f of fields) {
      const raw = data[f.name];
      result[f.name] =
        raw == null
          ? ''
          : typeof raw === 'string'
            ? raw
            : typeof raw === 'number' || typeof raw === 'boolean'
              ? String(raw)
              : '';
    }
    return result;
  };
  const [email, setEmail] = useState(voter.email);
  const [fieldValues, setFieldValues] =
    useState<Record<string, string>>(initialFieldValues);
  const [submitting, setSubmitting] = useState(false);

  const fieldErrors: Record<string, string | null> = {};
  for (const f of fields) {
    fieldErrors[f._id] = validateFieldValue(f.type, fieldValues[f.name] ?? '');
  }
  const hasFieldErrors = Object.values(fieldErrors).some((e) => e !== null);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setEmail(voter.email);
      setFieldValues(initialFieldValues());
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" aria-label="Edit voter">
            <Pencil className="size-3.5" />
          </Button>
        }
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit voter</DialogTitle>
          <DialogDescription>
            Update this voter's email and field values.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            try {
              const trimmed: Record<string, string> = {};
              for (const f of fields) {
                const value = fieldValues[f.name]?.trim();
                if (value) trimmed[f.name] = value;
              }
              await update({
                id: voter._id,
                email,
                ...(Object.keys(trimmed).length > 0 ? { fields: trimmed } : {}),
              });
              toast.success('Voter updated');
              setOpen(false);
            } catch (err) {
              toast.error(
                err instanceof ConvexError
                  ? ((err.data as { message?: string }).message ?? 'Failed')
                  : 'Failed',
              );
            } finally {
              setSubmitting(false);
            }
          }}
          className="space-y-3"
        >
          <div className="space-y-1">
            <Label htmlFor={`edit-voter-email-${voter._id}`}>Email</Label>
            <Input
              id={`edit-voter-email-${voter._id}`}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {fields.length > 0 && (
            <div className="space-y-3 border-t pt-3">
              {fields.map((f) => {
                const id = `edit-voter-field-${voter._id}-${f._id}`;
                const error = fieldErrors[f._id];
                if (f.type === 'boolean') {
                  return (
                    <div key={f._id} className="space-y-1">
                      <VoterFieldLabel htmlFor={id} field={f} />
                      <Select
                        value={fieldValues[f.name] ?? ''}
                        onValueChange={(v) =>
                          setFieldValues((s) => ({ ...s, [f.name]: v ?? '' }))
                        }
                      >
                        <SelectTrigger id={id}>
                          <SelectValue placeholder="true" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">true</SelectItem>
                          <SelectItem value="false">false</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
                return (
                  <div key={f._id} className="space-y-1">
                    <VoterFieldLabel htmlFor={id} field={f} />
                    <Input
                      id={id}
                      type={htmlInputTypeFor(f.type)}
                      value={fieldValues[f.name] ?? ''}
                      placeholder={sampleValueForType(f.type, 0)}
                      aria-invalid={error ? true : undefined}
                      onChange={(e) =>
                        setFieldValues((s) => ({
                          ...s,
                          [f.name]: e.target.value,
                        }))
                      }
                    />
                    {error && (
                      <p className="text-xs text-destructive">{error}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || hasFieldErrors}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ManageFieldsDialog({
  electionId,
  fields,
}: {
  electionId: Doc<'elections'>['_id'];
  fields: Doc<'voter_fields'>[];
}) {
  const create = useMutation(api.voterFields.create);
  const update = useMutation(api.voterFields.update);
  const softDelete = useMutation(api.voterFields.softDelete);

  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<VoterFieldType>('text');
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<Doc<'voter_fields'>['_id'] | null>(
    null,
  );
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<VoterFieldType>('text');
  const [savingEdit, setSavingEdit] = useState(false);

  const handleError = (err: unknown) => {
    toast.error(
      err instanceof ConvexError
        ? ((err.data as { message?: string }).message ?? 'Failed')
        : 'Failed',
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await create({ electionId, name: newName, type: newType });
      setNewName('');
      setNewType('text');
      toast.success('Field added');
    } catch (err) {
      handleError(err);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (f: Doc<'voter_fields'>) => {
    setEditingId(f._id);
    setEditName(f.name);
    setEditType(f.type);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditType('text');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSavingEdit(true);
    try {
      await update({ id: editingId, name: editName, type: editType });
      cancelEdit();
      toast.success('Field updated');
    } catch (err) {
      handleError(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (f: Doc<'voter_fields'>) => {
    if (!confirm(`Delete the "${f.name}" field?`)) return;
    try {
      await softDelete({ id: f._id });
      if (editingId === f._id) cancelEdit();
      toast.success('Field removed');
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Settings className="size-4" /> Manage fields
          </Button>
        }
      />

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Voter fields</DialogTitle>
          <DialogDescription>
            Define the extra columns that appear in the sample import file and
            on each voter record. The <span className="font-mono">email</span>{' '}
            column is always required.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleCreate}
          className="flex items-end gap-2 rounded-md border p-3"
        >
          <div className="flex-1">
            <Label htmlFor="new-field-name" className="mb-1 text-xs">
              Name
            </Label>
            <Input
              id="new-field-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Section"
            />
          </div>
          <div className="flex-1">
            <Label className="mb-1 text-xs">Type</Label>
            <Select
              value={
                FIELD_TYPES.find((t) => t.value === newType)?.label ?? 'Text'
              }
              onValueChange={(v) => isVoterFieldType(v) && setNewType(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={creating || !newName.trim()}>
            <Plus className="mr-1 size-3.5" />
            Add
          </Button>
        </form>

        {fields.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No custom fields yet.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {fields.map((f) => {
              const isEditing = editingId === f._id;
              return (
                <li key={f._id} className="flex items-center gap-2 px-3 py-2">
                  {isEditing ? (
                    <>
                      <Input
                        className="flex-1"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <Select
                        value={editType}
                        onValueChange={(v) =>
                          isVoterFieldType(v) && setEditType(v)
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        disabled={savingEdit || !editName.trim()}
                        onClick={saveEdit}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={savingEdit}
                        onClick={cancelEdit}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate font-mono text-sm">
                        {f.name}
                      </span>
                      <span className="text-xs tracking-wide text-muted-foreground uppercase">
                        {f.type}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(f)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(f)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteVoterButton({ id }: { id: Doc<'voters'>['_id'] }) {
  const softDelete = useMutation(api.voters.softDelete);
  const [deleting, setDeleting] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={deleting}
      onClick={async () => {
        if (!confirm('Remove this voter?')) return;
        setDeleting(true);
        try {
          await softDelete({ id });
          toast.success('Voter removed');
        } catch (err) {
          toast.error(
            err instanceof ConvexError
              ? ((err.data as { message?: string }).message ?? 'Failed')
              : 'Failed',
          );
        } finally {
          setDeleting(false);
        }
      }}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}

function ExportVotersButton({
  electionId,
  slug,
  fields,
}: {
  electionId: Id<'elections'>;
  slug: string;
  fields: Doc<'voter_fields'>[];
}) {
  const convex = useConvex();
  const [pending, setPending] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const rows = await convex.query(api.voters.listForExport, {
            electionId,
          });
          const customCols = fields.map((f) => f.name);
          const header = [
            'email',
            'voted_at',
            'unsubscribed_at',
            ...customCols,
          ];
          const escape = (v: string | number | null | undefined) => {
            if (v == null) return '';
            const s = String(v);
            return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
          };
          const lines = [header.join(',')];
          for (const r of rows) {
            const fieldMap = r.field ?? {};
            const cols = [
              escape(r.email),
              escape(r.votedAt ? new Date(r.votedAt).toISOString() : ''),
              escape(
                r.unsubscribedAt
                  ? new Date(r.unsubscribedAt).toISOString()
                  : '',
              ),
              ...customCols.map((name) => escape(fieldMap[name] ?? '')),
            ];
            lines.push(cols.join(','));
          }
          const blob = new Blob([lines.join('\n')], {
            type: 'text/csv;charset=utf-8',
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${slug}-voters-${new Date().toISOString().slice(0, 10)}.csv`;
          link.click();
          URL.revokeObjectURL(url);
        } catch (err) {
          toast.error(
            err instanceof ConvexError
              ? ((err.data as { message?: string }).message ?? 'Failed')
              : 'Failed to export voters',
          );
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}{' '}
      Export CSV
    </Button>
  );
}
