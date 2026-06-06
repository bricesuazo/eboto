import { convexQuery } from '@convex-dev/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import dayjs from 'dayjs';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { api } from '@eboto/backend/api';
import type { Id } from '@eboto/backend/data-model';
import { votingEndAt, votingStartAt } from '@eboto/backend/election-timing';

import { DashboardPending } from '~/components/dashboard-pending';
import { DatePicker } from '~/components/date-picker';
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
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '~/components/ui/combobox';
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
import type { ElectionSettingsInput } from '~/lib/schemas/election';
import { electionSettingsSchema } from '~/lib/schemas/election';
import { DEFAULT_TIMEZONE, listTimezones } from '~/lib/timezone';
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
  head: ({ params }) => ({
    meta: [{ title: `${params.electionDashboardSlug} · Settings | eBoto` }],
  }),
  pendingComponent: DashboardPending,
  component: SettingsPage,
});

type FormValues = ElectionSettingsInput;

// IANA timezone names are static for the runtime — compute once.
const TIMEZONES = listTimezones();
const formatTimezoneLabel = (tz: string) => tz.replace(/_/g, ' ');

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
    resolver: zodResolver(electionSettingsSchema),
    defaultValues: {
      name: election.name,
      slug: election.slug,
      description: election.description,
      startDate: dayjs(election.startDate).format('YYYY-MM-DD'),
      endDate: dayjs(election.endDate).format('YYYY-MM-DD'),
      votingHourStart: election.votingHourStart,
      votingHourEnd: election.votingHourEnd,
      timezone: election.timezone ?? DEFAULT_TIMEZONE,
      publicity: election.publicity,
      nameArrangement: election.nameArrangement,
      isCandidatesVisibleInRealtimeWhenOngoing:
        election.isCandidatesVisibleInRealtimeWhenOngoing,
      voterDomain: election.voterDomain ?? '',
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
          values.votingHourEnd !== prev.votingHourEnd ||
          values.timezone !== (prev.timezone ?? DEFAULT_TIMEZONE);
        if (timingChanged) {
          const timing = {
            startDate,
            endDate,
            votingHourStart: values.votingHourStart,
            votingHourEnd: values.votingHourEnd,
            timezone: values.timezone,
          };
          // Non-blocking: the settings are already saved. Surface a warning
          // (rather than swallow) if the schedule emit fails so a misconfig
          // isn't invisible.
          scheduleElectionLifecycleFn({
            data: {
              electionId,
              slug: result.slug,
              startAt: votingStartAt(timing),
              endAt: votingEndAt(timing),
              timezone: timing.timezone,
            },
          })
            .then((res) => {
              if (!res.ok) {
                console.error('[inngest] schedule failed:', res.error);
                toast.warning(
                  'Settings saved, but updating the email schedule failed. Save again to retry.',
                );
              }
            })
            .catch((err) => {
              console.error('[inngest] schedule request failed', err);
              toast.warning(
                'Settings saved, but updating the email schedule failed. Save again to retry.',
              );
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
                processing={logo.processing}
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
                  render={({ field }) => {
                    const earliestStart = dayjs()
                      .add(1, 'day')
                      .startOf('day')
                      .toDate();
                    return (
                      <FormItem>
                        <FormLabel>Start date</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={(next) => {
                              field.onChange(next);
                              const currentEnd = form.getValues('endDate');
                              if (
                                currentEnd &&
                                !dayjs(currentEnd).isAfter(dayjs(next), 'day')
                              ) {
                                form.setValue('endDate', '');
                              }
                            }}
                            disabledBefore={earliestStart}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => {
                    const startDateValue = form.watch('startDate');
                    const earliestEnd = startDateValue
                      ? dayjs(startDateValue)
                          .add(1, 'day')
                          .startOf('day')
                          .toDate()
                      : dayjs().add(2, 'day').startOf('day').toDate();
                    return (
                      <FormItem>
                        <FormLabel>End date</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            disabledBefore={earliestEnd}
                            disabled={!startDateValue}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="votingHourStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voting starts</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(Number(v))}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pick a time">
                              {parseHourTo12HourFormat(field.value)}
                            </SelectValue>
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
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pick a time">
                              {parseHourTo12HourFormat(field.value)}
                            </SelectValue>
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
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Combobox
                      items={TIMEZONES}
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value ?? DEFAULT_TIMEZONE)
                      }
                      itemToStringLabel={formatTimezoneLabel}
                    >
                      <FormControl>
                        <ComboboxInput placeholder="Search timezone…" />
                      </FormControl>
                      <ComboboxContent>
                        <ComboboxEmpty>No timezone found.</ComboboxEmpty>
                        <ComboboxList>
                          {(tz: string) => (
                            <ComboboxItem key={tz} value={tz}>
                              {formatTimezoneLabel(tz)}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    <FormDescription>
                      Voting dates and hours are interpreted in this timezone.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      <SelectContent className="min-w-64">
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
                name="voterDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voter email domain (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="example.edu"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormDescription>
                      When set, only voter emails in this domain can be added.
                      Leave empty to allow any domain.
                    </FormDescription>
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

      <CommissionersCard electionId={election._id} />

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
  electionId: Id<'elections'>;
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
          await softDelete({ id: electionId });
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

function CommissionersCard({ electionId }: { electionId: Id<'elections'> }) {
  const { data: commissioners = [] } = useQuery(
    convexQuery(api.commissioners.list, { electionId }),
  );
  const { data: invites = [] } = useQuery(
    convexQuery(api.commissioners.listInvites, { electionId }),
  );
  const add = useMutation(api.commissioners.addByEmail);
  const remove = useMutation(api.commissioners.remove);
  const cancelInvite = useMutation(api.commissioners.cancelInvite);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commissioners</CardTitle>
        <CardDescription>
          Anyone listed here can manage this election (edit settings,
          candidates, voters, send messages). Adding someone sends them an
          email invite; they become a commissioner once they accept (which
          uses one of their own Plus credits or their first free slot).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex items-center gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!email.trim()) return;
            setAdding(true);
            try {
              await add({
                electionId,
                email: email.trim(),
              });
              toast.success('Invite sent.');
              setEmail('');
            } catch (err) {
              toast.error(
                err instanceof ConvexError
                  ? ((err.data as { message?: string }).message ?? 'Failed')
                  : 'Failed',
              );
            } finally {
              setAdding(false);
            }
          }}
        >
          <Input
            type="email"
            placeholder="commissioner@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" disabled={adding}>
            {adding ? 'Adding…' : 'Add'}
          </Button>
        </form>
        <ul className="divide-y rounded-md border">
          {commissioners.length === 0 && invites.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              No commissioners yet.
            </li>
          ) : (
            <>
              {commissioners.map((c) => (
                <li
                  key={c._id}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{c.email ?? '—'}</div>
                    {c.name && (
                      <div className="text-xs text-muted-foreground">
                        {c.name}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (
                        !confirm(
                          `Remove ${c.email ?? 'this commissioner'} from this election?`,
                        )
                      )
                        return;
                      try {
                        await remove({ commissionerId: c._id });
                        toast.success('Commissioner removed.');
                      } catch (err) {
                        toast.error(
                          err instanceof ConvexError
                            ? ((err.data as { message?: string }).message ??
                                'Failed')
                            : 'Failed',
                        );
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
              {invites.map((invite) => (
                <li
                  key={invite._id}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{invite.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Pending — waiting for them to accept
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (
                        !confirm(`Cancel the invite for ${invite.email}?`)
                      )
                        return;
                      try {
                        await cancelInvite({ inviteId: invite._id });
                        toast.success('Invite cancelled.');
                      } catch (err) {
                        toast.error(
                          err instanceof ConvexError
                            ? ((err.data as { message?: string }).message ??
                                'Failed')
                            : 'Failed',
                        );
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
