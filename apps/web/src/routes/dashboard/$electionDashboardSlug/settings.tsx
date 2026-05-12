import { useState } from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import dayjs from 'dayjs';
import { Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { api } from '@eboto/backend/api';
import { votingEndAt, votingStartAt } from '@eboto/backend/election-timing';
import { isSlugReserved } from '@eboto/backend/slugs';

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
import { Switch } from '~/components/ui/switch';
import { Textarea } from '~/components/ui/textarea';
import { parseHourTo12HourFormat } from '~/lib/election';
import { scheduleElectionLifecycleFn } from '~/lib/inngest/server-fns';
import { useImageUpload } from '~/lib/use-image-upload';

export const Route = createFileRoute(
  '/dashboard/$electionDashboardSlug/settings',
)({
  beforeLoad: async ({ context, params }) => {
    const election = await context.queryClient.ensureQueryData(
      convexQuery(api.elections.getDashboardBySlug, {
        slug: params.electionDashboardSlug,
      }),
    );
    if (!election) throw notFound();
  },
  pendingComponent: DashboardPending,
  component: SettingsPage,
});

const slugRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const schema = z
  .object({
    name: z.string().min(1, 'Required'),
    slug: z
      .string()
      .min(1, 'Required')
      .toLowerCase()
      .regex(slugRegex, 'Lowercase letters, digits, dashes only')
      .refine((s) => !isSlugReserved(s), 'That slug is reserved'),
    description: z.string(),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    votingHourStart: z.number().int().min(0).max(23),
    votingHourEnd: z.number().int().min(1).max(24),
    publicity: z.enum(['PRIVATE', 'VOTER', 'PUBLIC']),
    nameArrangement: z.number().int().min(0).max(1),
    isCandidatesVisibleInRealtimeWhenOngoing: z.boolean(),
  })
  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    path: ['endDate'],
    message: 'End must be after start',
  })
  .refine((d) => d.votingHourEnd > d.votingHourStart, {
    path: ['votingHourEnd'],
    message: 'End hour must be after start hour',
  });

type FormValues = z.infer<typeof schema>;

function SettingsPage() {
  const { electionDashboardSlug } = Route.useParams();
  const navigate = useNavigate();
  const { data: election } = useQuery(
    convexQuery(api.elections.getDashboardBySlug, {
      slug: electionDashboardSlug,
    }),
  );
  if (!election) throw notFound();
  const electionId = election._id;
  const update = useMutation(api.elections.update);
  const setLogo = useMutation(api.elections.setLogo);
  const logo = useImageUpload(election.logoUrl);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: election.name,
      slug: election.slug,
      description: election.description,
      startDate: dayjs(election.startDate).format('YYYY-MM-DD'),
      endDate: dayjs(election.endDate).format('YYYY-MM-DD'),
      votingHourStart: election.votingHourStart,
      votingHourEnd: election.votingHourEnd,
      publicity: election.publicity,
      nameArrangement: election.nameArrangement,
      isCandidatesVisibleInRealtimeWhenOngoing:
        election.isCandidatesVisibleInRealtimeWhenOngoing,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const logoStorageId = await logo.commit();
      const startDate = new Date(values.startDate).getTime();
      const endDate = new Date(values.endDate).getTime();
      const result = await update({
        id: electionId,
        ...values,
        startDate,
        endDate,
      });
      if (logoStorageId !== undefined) {
        await setLogo({ id: electionId, storageId: logoStorageId });
      }
      // Re-emit lifecycle on any timing change. Inngest's `cancelOn`
      // (matched on `electionId`) aborts any prior in-flight runs, so the
      // new event becomes the source of truth.
      const prev = election;
      if (prev) {
        const timingChanged =
          startDate !== prev.startDate ||
          endDate !== prev.endDate ||
          values.votingHourStart !== prev.votingHourStart ||
          values.votingHourEnd !== prev.votingHourEnd;
        if (timingChanged) {
          const timing = {
            startDate,
            endDate,
            votingHourStart: values.votingHourStart,
            votingHourEnd: values.votingHourEnd,
          };
          void scheduleElectionLifecycleFn({
            data: {
              electionId: electionId as unknown as string,
              slug: result.slug,
              startAt: votingStartAt(timing),
              endAt: votingEndAt(timing),
            },
          });
        }
      }
      toast.success('Settings saved');
      if (result.slug !== electionDashboardSlug) {
        await navigate({
          to: '/dashboard/$electionDashboardSlug/settings',
          params: { electionDashboardSlug: result.slug },
          replace: true,
        });
      }
    } catch (err) {
      toast.error(
        err instanceof ConvexError
          ? ((err.data as { message?: string }).message ?? 'Failed')
          : 'Failed',
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Tune election timing, visibility, and danger zone.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Basics shown on the public page.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <ImageUpload
                label="Logo"
                previewUrl={logo.previewUrl}
                onPick={logo.pick}
                error={logo.error}
                disabled={form.formState.isSubmitting}
              />
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
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL slug</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Voters will visit{' '}
                      <span className="font-mono">
                        eboto.app/{field.value || 'your-slug'}
                      </span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="votingHourStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voting starts</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(Number(v))}
                        value={parseHourTo12HourFormat(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, h) => (
                            <SelectItem key={h} value={String(h)}>
                              {parseHourTo12HourFormat(h)}
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
                  name="votingHourEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voting ends</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(Number(v))}
                        value={parseHourTo12HourFormat(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                            <SelectItem key={h} value={String(h)}>
                              {parseHourTo12HourFormat(h)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="publicity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publicity</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PRIVATE">
                          Private — commissioners only
                        </SelectItem>
                        <SelectItem value="VOTER">
                          Voter — registered voters only
                        </SelectItem>
                        <SelectItem value="PUBLIC">
                          Public — anyone can view
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isCandidatesVisibleInRealtimeWhenOngoing"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Show real candidate names during the live result
                      </FormLabel>
                      <FormDescription>
                        When off, candidates show as "Candidate 1, 2, …" until
                        the election ends.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Deleting an election hides it from voters and the dashboard. Votes
            are preserved server-side but become inaccessible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteElectionButton
            electionId={election._id}
            onDeleted={() => navigate({ to: '/dashboard' })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function DeleteElectionButton({
  electionId,
  onDeleted,
}: {
  electionId: string;
  onDeleted: () => void;
}) {
  const softDelete = useMutation(api.elections.softDelete);
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="destructive"
      disabled={pending}
      onClick={async () => {
        if (!confirm('Delete this election? This cannot be undone.')) return;
        setPending(true);
        try {
          await softDelete({ id: electionId as never });
          toast.success('Election deleted');
          onDeleted();
        } catch (err) {
          toast.error(
            err instanceof ConvexError
              ? ((err.data as { message?: string }).message ?? 'Failed')
              : 'Failed',
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <Trash2 className="size-4" />
      Delete election
    </Button>
  );
}
