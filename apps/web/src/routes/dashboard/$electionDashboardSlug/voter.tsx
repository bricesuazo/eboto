import { useState } from 'react';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { convexQuery } from '@convex-dev/react-query';
import { useMutation } from 'convex/react';
import { DashboardPending } from '~/components/dashboard-pending';
import { ConvexError } from 'convex/values';
import { api } from '@eboto/backend/api';
import type { Doc } from '@eboto/backend/data-model';
import { toast } from 'sonner';
import { CheckCircle2, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
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
import { Label } from '~/components/ui/label';

export const Route = createFileRoute(
  '/dashboard/$electionDashboardSlug/voter',
)({
  beforeLoad: async ({ context, params }) => {
    const election = await context.queryClient.ensureQueryData(
      convexQuery(api.elections.getDashboardBySlug, {
        slug: params.electionDashboardSlug,
      }),
    );
    if (!election) throw notFound();
    await context.queryClient.ensureQueryData(
      convexQuery(api.voters.list, { electionId: election._id }),
    );
  },
  pendingComponent: DashboardPending,
  component: VoterPage,
});

function VoterPage() {
  const { electionDashboardSlug } = Route.useParams();
  const { data: election } = useQuery(
    convexQuery(api.elections.getDashboardBySlug, {
      slug: electionDashboardSlug,
    }),
  );
  if (!election) throw notFound();
  const { data: voters = [] } = useQuery(
    convexQuery(api.voters.list, { electionId: election._id }),
  );

  const totalVoted = voters.filter((v) => v.hasVoted).length;
  const turnoutPct =
    voters.length === 0 ? 0 : Math.round((totalVoted / voters.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Voters</h1>
          <p className="text-muted-foreground text-sm">
            {voters.length} registered · {totalVoted} voted ({turnoutPct}%
            turnout)
          </p>
        </div>
        <div className="flex gap-2">
          <BulkImportDialog electionId={election._id} />
          <SingleAddDialog electionId={election._id} />
        </div>
      </div>

      {voters.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            No voters registered yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {voters.map((v) => (
                <li
                  key={v._id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="truncate font-mono text-sm">{v.email}</span>
                  <div className="flex items-center gap-3">
                    {v.hasVoted && (
                      <span className="text-xs text-emerald-600 inline-flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        voted
                      </span>
                    )}
                    {!v.hasVoted && <DeleteVoterButton id={v._id} />}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SingleAddDialog({
  electionId,
}: {
  electionId: Doc<'elections'>['_id'];
}) {
  const create = useMutation(api.voters.create);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" /> Add voter
        </Button>
      </DialogTrigger>
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
              await create({ electionId, email });
              toast.success('Voter added');
              setEmail('');
              setOpen(false);
            } catch (err) {
              toast.error(
                err instanceof ConvexError
                  ? (err.data as { message?: string }).message ?? 'Failed'
                  : 'Failed',
              );
            } finally {
              setSubmitting(false);
            }
          }}
          className="space-y-3"
        >
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BulkImportDialog({
  electionId,
}: {
  electionId: Doc<'elections'>['_id'];
}) {
  const bulk = useMutation(api.voters.bulkCreate);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 size-4" /> Bulk import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk import voters</DialogTitle>
          <DialogDescription>
            Paste one email per line (or comma-separated). Duplicates are
            skipped.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const emails = text
              .split(/[\s,;]+/)
              .map((s) => s.trim())
              .filter(Boolean);
            if (emails.length === 0) return;
            setSubmitting(true);
            try {
              const r = await bulk({ electionId, emails });
              toast.success(`${r.added} added · ${r.skipped.length} skipped`);
              setText('');
              setOpen(false);
            } catch (err) {
              toast.error(
                err instanceof ConvexError
                  ? (err.data as { message?: string }).message ?? 'Failed'
                  : 'Failed',
              );
            } finally {
              setSubmitting(false);
            }
          }}
          className="space-y-3"
        >
          <Textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'jane@school.edu\njohn@school.edu\n…'}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Importing…' : 'Import'}
            </Button>
          </DialogFooter>
        </form>
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
              ? (err.data as { message?: string }).message ?? 'Failed'
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
