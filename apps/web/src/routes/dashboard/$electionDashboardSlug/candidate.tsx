import { useMemo, useState } from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { ListChecks, Pencil, Plus, Trash2, User, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { api } from '@eboto/backend/api';
import type { Doc } from '@eboto/backend/data-model';

import { CandidateCredentialsEditor } from '~/components/candidate-credentials-editor';
import { DashboardPending } from '~/components/dashboard-pending';
import { ImageUpload } from '~/components/image-upload';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { candidateSchema } from '~/lib/schemas/candidate';
import type { CandidateInput } from '~/lib/schemas/candidate';
import { useImageUpload } from '~/lib/use-image-upload';

export const Route = createFileRoute(
  '/dashboard/$electionDashboardSlug/candidate',
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
        convexQuery(api.candidates.list, { electionId: election._id }),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.positions.list, { electionId: election._id }),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.partylists.list, { electionId: election._id }),
      ),
    ]);
  },
  head: ({ params }) => ({
    meta: [{ title: `${params.electionDashboardSlug} · Candidates | eBoto` }],
  }),
  pendingComponent: DashboardPending,
  component: CandidatePage,
});

type FormValues = CandidateInput;

function CandidatePage() {
  const { electionDashboardSlug } = Route.useParams();
  // Data is pre-fetched in `beforeLoad`, so these `useQuery` calls hit the
  // cache synchronously — `data` is always defined by the time we render.
  const { data: election } = useQuery(
    convexQuery(api.elections.getDashboardBySlug, {
      slug: electionDashboardSlug,
    }),
  );
  if (!election) throw notFound();
  const { data: candidates = [] } = useQuery(
    convexQuery(api.candidates.list, { electionId: election._id }),
  );
  const { data: positions = [] } = useQuery(
    convexQuery(api.positions.list, { electionId: election._id }),
  );
  const { data: partylists = [] } = useQuery(
    convexQuery(api.partylists.list, { electionId: election._id }),
  );

  // `creating` carries the position the user clicked "Add candidate" under,
  // so the form opens with that position pre-selected and the user doesn't
  // have to pick again in the dropdown.
  const [creating, setCreating] = useState<{
    positionId: Doc<'positions'>['_id'];
  } | null>(null);
  const [editing, setEditing] = useState<(typeof candidates)[number] | null>(
    null,
  );
  const [credentialsFor, setCredentialsFor] = useState<
    (typeof candidates)[number] | null
  >(null);

  const noPositions = positions.length === 0;
  const noPartylists = partylists.length === 0;
  const noDeps = noPositions || noPartylists;

  // Bucket candidates by position once. Positions render in `order`, and the
  // map below is keyed on the position id so we can look up an array in O(1)
  // per render row.
  const candidatesByPosition = useMemo(() => {
    const map = new Map<string, typeof candidates>();
    for (const c of candidates) {
      const list = map.get(c.positionId) ?? [];
      list.push(c);
      map.set(c.positionId, list);
    }
    return map;
  }, [candidates]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="text-sm text-muted-foreground">
            Candidates are grouped by position. Use the button on each
            position to add a candidate to it.
          </p>
        </div>
      </div>

      {noDeps && (
        <Card>
          <CardContent className="space-y-2 py-8 text-center text-sm text-muted-foreground">
            <p>Set up these first before adding candidates:</p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {noPositions && (
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link
                      to="/dashboard/$electionDashboardSlug/position"
                      params={{ electionDashboardSlug }}
                    >
                      Add a position
                    </Link>
                  }
                />
              )}
              {noPartylists && (
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link
                      to="/dashboard/$electionDashboardSlug/partylist"
                      params={{ electionDashboardSlug }}
                    >
                      Add a partylist
                    </Link>
                  }
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!noDeps && (
        <div className="space-y-4">
          {positions.map((position) => {
            const rows = candidatesByPosition.get(position._id) ?? [];
            return (
              <Card key={position._id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="min-w-0">
                    <CardTitle className="text-lg">{position.name}</CardTitle>
                    <CardDescription>
                      {rows.length} candidate{rows.length === 1 ? '' : 's'} ·
                      pick {position.min === position.max
                        ? position.max
                        : `${position.min}–${position.max}`}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setCreating({ positionId: position._id })}
                  >
                    <Plus className="mr-1 size-4" />
                    Add candidate
                  </Button>
                </CardHeader>
                <CardContent>
                  {rows.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                      <Users className="size-6" />
                      <p>No candidates for this position yet.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCreating({ positionId: position._id })
                        }
                      >
                        <Plus className="mr-1 size-4" />
                        Add the first candidate
                      </Button>
                    </div>
                  ) : (
                    <ul className="divide-y rounded-md border">
                      {rows.map((c) => (
                        <li
                          key={c._id}
                          className="flex flex-wrap items-center gap-3 px-3 py-2.5"
                        >
                          {c.imageUrl ? (
                            <img
                              src={c.imageUrl}
                              alt=""
                              className="size-10 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                              <User className="size-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {c.firstName}{' '}
                              {c.middleName && `${c.middleName.charAt(0)}. `}
                              {c.lastName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {c.partylist?.acronym ?? '—'}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCredentialsFor(c)}
                            >
                              <ListChecks className="size-3.5" />
                              <span className="sr-only">Credentials</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditing(c)}
                            >
                              <Pencil className="size-3.5" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <DeleteCandidateButton id={c._id} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={Boolean(creating)}
        onOpenChange={(open) => !open && setCreating(null)}
      >
        {creating && (
          <CandidateDialog
            mode="create"
            electionId={election._id}
            electionSlug={election.slug}
            positions={positions}
            partylists={partylists}
            defaultPositionId={creating.positionId}
            onClose={() => setCreating(null)}
          />
        )}
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        {editing && (
          <CandidateDialog
            mode="edit"
            electionId={election._id}
            electionSlug={election.slug}
            positions={positions}
            partylists={partylists}
            initial={editing}
            initialImageUrl={editing.imageUrl}
            onClose={() => setEditing(null)}
          />
        )}
      </Dialog>

      <Dialog
        open={Boolean(credentialsFor)}
        onOpenChange={(open) => !open && setCredentialsFor(null)}
      >
        {credentialsFor && (
          <CandidateCredentialsEditor
            candidateId={credentialsFor._id}
            candidateName={`${credentialsFor.firstName} ${credentialsFor.lastName}`}
            onClose={() => setCredentialsFor(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

function CandidateDialog({
  mode,
  electionId,
  electionSlug,
  positions,
  partylists,
  initial,
  initialImageUrl,
  defaultPositionId,
  onClose,
}: {
  mode: 'create' | 'edit';
  electionId: Doc<'elections'>['_id'];
  electionSlug: string;
  positions: Doc<'positions'>[];
  partylists: Doc<'partylists'>[];
  initial?: Doc<'candidates'>;
  initialImageUrl?: string | null;
  /** Pre-selects a position when creating from a per-position "Add" button. */
  defaultPositionId?: Doc<'positions'>['_id'];
  onClose: () => void;
}) {
  const create = useMutation(api.candidates.create);
  const update = useMutation(api.candidates.update);
  const setImage = useMutation(api.candidates.setImage);
  const photo = useImageUpload(initialImageUrl);

  const form = useForm<FormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      firstName: initial?.firstName ?? '',
      middleName: initial?.middleName ?? '',
      lastName: initial?.lastName ?? '',
      slug: initial?.slug ?? '',
      positionId:
        initial?.positionId ?? defaultPositionId ?? positions[0]?._id ?? '',
      partylistId: initial?.partylistId ?? partylists[0]?._id ?? '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const imageStorageId = await photo.commit();
      if (mode === 'create') {
        await create({
          electionId,
          ...values,
          positionId: values.positionId as Doc<'positions'>['_id'],
          partylistId: values.partylistId as Doc<'partylists'>['_id'],
          imageStorageId: imageStorageId ?? undefined,
        });
        toast.success('Candidate created');
      } else if (initial) {
        await update({
          id: initial._id,
          ...values,
          positionId: values.positionId as Doc<'positions'>['_id'],
          partylistId: values.partylistId as Doc<'partylists'>['_id'],
        });
        if (imageStorageId !== undefined) {
          await setImage({ id: initial._id, storageId: imageStorageId });
        }
        toast.success('Candidate updated');
      }
      onClose();
    } catch (err) {
      toast.error(
        err instanceof ConvexError
          ? ((err.data as { message?: string }).message ?? 'Failed')
          : 'Failed',
      );
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {mode === 'create' ? 'New candidate' : 'Edit candidate'}
        </DialogTitle>
        <DialogDescription>
          {mode === 'create'
            ? 'Add the candidate. Platforms and credentials are managed from the candidate row after creation.'
            : 'Update the candidate. Manage platforms and credentials from the credentials tab.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <ImageUpload
            label="Photo"
            shape="square"
            previewUrl={photo.previewUrl}
            onPick={photo.pick}
            error={photo.error}
            disabled={form.formState.isSubmitting}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="middleName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Middle name (optional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="jane-doe" {...field} />
                </FormControl>
                <FormDescription>
                  Candidate page:{' '}
                  <span className="font-mono">
                    eboto.app/{electionSlug}/{field.value || 'candidate-slug'}
                  </span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="positionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={positions.find((p) => p._id === field.value)?.name}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {positions.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partylistId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partylist</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={
                      partylists.find((p) => p._id === field.value)?.acronym
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {partylists.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.acronym}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? 'Saving…'
                : mode === 'create'
                  ? 'Create'
                  : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

function DeleteCandidateButton({ id }: { id: Doc<'candidates'>['_id'] }) {
  const softDelete = useMutation(api.candidates.softDelete);
  const [deleting, setDeleting] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={deleting}
      onClick={async () => {
        if (!confirm('Delete this candidate?')) return;
        setDeleting(true);
        try {
          await softDelete({ id });
          toast.success('Candidate deleted');
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
      <Trash2 className="size-3.5 text-destructive" />
      <span className="sr-only">Delete</span>
    </Button>
  );
}
