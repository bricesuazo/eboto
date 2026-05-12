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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';

export const Route = createFileRoute(
  '/dashboard/$electionDashboardSlug/position',
)({
  beforeLoad: async ({ context, params }) => {
    const election = await context.queryClient.ensureQueryData(
      convexQuery(api.elections.getDashboardBySlug, {
        slug: params.electionDashboardSlug,
      }),
    );
    if (!election) throw notFound();
    await context.queryClient.ensureQueryData(
      convexQuery(api.positions.list, { electionId: election._id }),
    );
  },
  pendingComponent: DashboardPending,
  component: PositionPage,
});

const schema = z
  .object({
    name: z.string().min(1, 'Required'),
    description: z.string().optional(),
    min: z.coerce.number().int().min(0),
    max: z.coerce.number().int().min(1),
  })
  .refine((d) => d.min <= d.max, {
    path: ['min'],
    message: 'Min must be ≤ max',
  });
type FormValues = z.infer<typeof schema>;

function PositionPage() {
  const { electionDashboardSlug } = Route.useParams();
  const { data: election } = useQuery(
    convexQuery(api.elections.getDashboardBySlug, {
      slug: electionDashboardSlug,
    }),
  );
  if (!election) throw notFound();
  const { data: positions = [] } = useQuery(
    convexQuery(api.positions.list, { electionId: election._id }),
  );

  const [editing, setEditing] = useState<Doc<'positions'> | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Positions</h1>
          <p className="text-sm text-muted-foreground">
            Roles voters will choose candidates for. Order is preserved on the
            ballot.
          </p>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="size-4" />
                New position
              </Button>
            }
          />
          <PositionDialog
            mode="create"
            electionId={election._id}
            onClose={() => setCreating(false)}
          />
        </Dialog>
      </div>

      {positions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No positions yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {positions.map((pos, i) => (
            <Card key={pos._id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <span className="font-mono text-xs text-muted-foreground">
                    #{i + 1}
                  </span>
                  {pos.name}
                </CardTitle>
                {pos.description && (
                  <CardDescription className="line-clamp-2">
                    {pos.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {pos.min === 0 && pos.max === 1
                    ? 'Pick 1 candidate'
                    : `Pick ${pos.min}–${pos.max} candidates`}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(pos)}
                  >
                    <Pencil className="mr-1.5 size-3.5" /> Edit
                  </Button>
                  <DeletePositionButton id={pos._id} />
                </div>
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
          <PositionDialog
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

function PositionDialog({
  mode,
  electionId,
  initial,
  onClose,
}: {
  mode: 'create' | 'edit';
  electionId: Doc<'elections'>['_id'];
  initial?: Doc<'positions'>;
  onClose: () => void;
}) {
  const create = useMutation(api.positions.create);
  const update = useMutation(api.positions.update);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      min: initial?.min ?? 0,
      max: initial?.max ?? 1,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (mode === 'create') {
        await create({ electionId, ...values });
        toast.success('Position created');
      } else if (initial) {
        await update({ id: initial._id, ...values });
        toast.success('Position updated');
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
          {mode === 'create' ? 'New position' : 'Edit position'}
        </DialogTitle>
        <DialogDescription>Voters cast a vote per position.</DialogDescription>
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="min"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min picks</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormDescription>0 allows abstain</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max picks</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
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

function DeletePositionButton({ id }: { id: Doc<'positions'>['_id'] }) {
  const softDelete = useMutation(api.positions.softDelete);
  const [deleting, setDeleting] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={deleting}
      onClick={async () => {
        if (!confirm('Delete this position? This cannot be undone.')) return;
        setDeleting(true);
        try {
          await softDelete({ id });
          toast.success('Position deleted');
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
