import { useState } from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { ListChecks, Pencil, Plus, Trash2, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { api } from '@eboto/backend/api';
import type { Doc } from '@eboto/backend/data-model';

import { CandidateCredentialsEditor } from '~/components/candidate-credentials-editor';
import { DashboardPending } from '~/components/dashboard-pending';
import { ImageUpload } from '~/components/image-upload';
import { Button } from '~/components/ui/button';
import { useImageUpload } from '~/lib/use-image-upload';
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
  DialogTrigger,
} from '~/components/ui/dialog';
import {
  Form,
  FormControl,
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
  pendingComponent: DashboardPending,
  component: CandidatePage,
});

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Required'),
  slug: z
    .string()
    .min(1, 'Required')
    .toLowerCase()
    .regex(
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
      'Lowercase letters/digits/dashes only',
    ),
  positionId: z.string().min(1, 'Required'),
  partylistId: z.string().min(1, 'Required'),
});
type FormValues = z.infer<typeof schema>;

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

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<(typeof candidates)[number] | null>(
    null,
  );
  const [credentialsFor, setCredentialsFor] = useState<
    (typeof candidates)[number] | null
  >(null);

  const noDeps = positions.length === 0 || partylists.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="text-muted-foreground text-sm">
            Add candidates and assign each one to a position + partylist.
          </p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger
            render={
              <Button disabled={noDeps}>
                <Plus className="mr-2 size-4" />
                New candidate
              </Button>
            }
          />
          <CandidateDialog
            mode="create"
            electionId={election._id}
            positions={positions}
            partylists={partylists}
            onClose={() => setCreating(false)}
          />
        </Dialog>
      </div>

      {noDeps && (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            Add at least one position and one partylist before creating
            candidates.
          </CardContent>
        </Card>
      )}

      {candidates.length === 0 ? (
        !noDeps && (
          <Card>
            <CardContent className="text-muted-foreground py-12 text-center text-sm">
              No candidates yet.
            </CardContent>
          </Card>
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {candidates.map((c) => (
            <Card key={c._id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt=""
                      className="size-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
                      <User className="size-5" />
                    </div>
                  )}
                  <span className="truncate">
                    {c.firstName}{' '}
                    {c.middleName && `${c.middleName.charAt(0)}. `}
                    {c.lastName}
                  </span>
                </CardTitle>
                <CardDescription>
                  {c.position?.name ?? '—'} · {c.partylist?.acronym ?? '—'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCredentialsFor(c)}
                >
                  <ListChecks className="mr-1.5 size-3.5" /> Credentials
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(c)}
                >
                  <Pencil className="mr-1.5 size-3.5" /> Edit
                </Button>
                <DeleteCandidateButton id={c._id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        {editing && (
          <CandidateDialog
            mode="edit"
            electionId={election._id}
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
  positions,
  partylists,
  initial,
  initialImageUrl,
  onClose,
}: {
  mode: 'create' | 'edit';
  electionId: Doc<'elections'>['_id'];
  positions: Doc<'positions'>[];
  partylists: Doc<'partylists'>[];
  initial?: Doc<'candidates'>;
  initialImageUrl?: string | null;
  onClose: () => void;
}) {
  const create = useMutation(api.candidates.create);
  const update = useMutation(api.candidates.update);
  const setImage = useMutation(api.candidates.setImage);
  const photo = useImageUpload(initialImageUrl);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: initial?.firstName ?? '',
      middleName: initial?.middleName ?? '',
      lastName: initial?.lastName ?? '',
      slug: initial?.slug ?? '',
      positionId: initial?.positionId ?? positions[0]?._id ?? '',
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
      variant="outline"
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
      <Trash2 className="mr-1.5 size-3.5" /> Delete
    </Button>
  );
}
