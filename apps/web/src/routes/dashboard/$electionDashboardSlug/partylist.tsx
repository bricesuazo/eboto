import { useState } from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { api } from '@eboto/backend/api';
import type { Doc } from '@eboto/backend/data-model';

import { DashboardPending } from '~/components/dashboard-pending';
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
import { Textarea } from '~/components/ui/textarea';

export const Route = createFileRoute(
  '/dashboard/$electionDashboardSlug/partylist',
)({
  beforeLoad: async ({ context, params }) => {
    const election = await context.queryClient.ensureQueryData(
      convexQuery(api.elections.getDashboardBySlug, {
        slug: params.electionDashboardSlug,
      }),
    );
    if (!election) throw notFound();
    await context.queryClient.ensureQueryData(
      convexQuery(api.partylists.list, { electionId: election._id }),
    );
  },
  pendingComponent: DashboardPending,
  component: PartylistPage,
});

const schema = z.object({
  name: z.string().min(1, 'Required'),
  acronym: z.string().min(1, 'Required').max(10, 'Max 10 characters'),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function PartylistPage() {
  const { electionDashboardSlug } = Route.useParams();
  const { data: election } = useQuery(
    convexQuery(api.elections.getDashboardBySlug, {
      slug: electionDashboardSlug,
    }),
  );
  if (!election) throw notFound();
  const { data: partylists = [] } = useQuery(
    convexQuery(api.partylists.list, { electionId: election._id }),
  );

  const [editing, setEditing] = useState<Doc<'partylists'> | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partylists</h1>
          <p className="text-muted-foreground text-sm">
            Groupings candidates can run under.
          </p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              New partylist
            </Button>
          </DialogTrigger>
          <PartylistDialog
            mode="create"
            electionId={election._id}
            onClose={() => setCreating(false)}
          />
        </Dialog>
      </div>

      {partylists.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            No partylists yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {partylists.map((pl) => (
            <Card key={pl._id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {pl.name}{' '}
                  <span className="text-muted-foreground font-normal">
                    ({pl.acronym})
                  </span>
                </CardTitle>
                {pl.description && (
                  <CardDescription className="line-clamp-2">
                    {pl.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(pl)}
                >
                  <Pencil className="mr-1.5 size-3.5" /> Edit
                </Button>
                {pl.acronym !== 'IND' && <DeletePartylistButton id={pl._id} />}
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
          <PartylistDialog
            mode="edit"
            initial={editing}
            electionId={election._id}
            onClose={() => setEditing(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

function PartylistDialog({
  mode,
  electionId,
  initial,
  onClose,
}: {
  mode: 'create' | 'edit';
  electionId: Doc<'elections'>['_id'];
  initial?: Doc<'partylists'>;
  onClose: () => void;
}) {
  const create = useMutation(api.partylists.create);
  const update = useMutation(api.partylists.update);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      acronym: initial?.acronym ?? '',
      description: initial?.description ?? '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (mode === 'create') {
        await create({ electionId, ...values });
        toast.success('Partylist created');
      } else if (initial) {
        await update({ id: initial._id, ...values });
        toast.success('Partylist updated');
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
          {mode === 'create' ? 'New partylist' : 'Edit partylist'}
        </DialogTitle>
        <DialogDescription>
          Used to group candidates running under the same banner.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="acronym"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Acronym</FormLabel>
                <FormControl>
                  <Input maxLength={10} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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

function DeletePartylistButton({ id }: { id: Doc<'partylists'>['_id'] }) {
  const softDelete = useMutation(api.partylists.softDelete);
  const [deleting, setDeleting] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={deleting}
      onClick={async () => {
        if (!confirm('Delete this partylist? This cannot be undone.')) return;
        setDeleting(true);
        try {
          await softDelete({ id });
          toast.success('Partylist deleted');
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
