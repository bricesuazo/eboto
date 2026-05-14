import { useEffect, useState } from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useAction, useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import dayjs from 'dayjs';
import { Loader2, Plus, Rocket } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { api } from '@eboto/backend/api';
import { votingEndAt, votingStartAt } from '@eboto/backend/election-timing';

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
import { parseHourTo12HourFormat } from '~/lib/election';
import { scheduleElectionLifecycleFn } from '~/lib/inngest/server-fns';
import type { ElectionCreateInput } from '~/lib/schemas/election';
import { electionCreateSchema } from '~/lib/schemas/election';
import { useImageUpload } from '~/lib/use-image-upload';

type FormValues = ElectionCreateInput;

interface NewElectionSearch {
  purchase?: 'plus';
}

export const Route = createFileRoute('/dashboard/new')({
  validateSearch: (search: Record<string, unknown>): NewElectionSearch => ({
    purchase: search.purchase === 'plus' ? 'plus' : undefined,
  }),
  beforeLoad: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.billing.myElectionQuota, {}),
    );
  },
  head: () => ({ meta: [{ title: 'New election | eBoto' }] }),
  component: NewElectionPage,
});

function NewElectionPage() {
  const navigate = useNavigate();
  const { purchase } = Route.useSearch();
  const createElection = useMutation(api.elections.create);
  const { data: quota } = useQuery(
    convexQuery(api.billing.myElectionQuota, {}),
  );
  const logo = useImageUpload();

  // After a successful Plus purchase LemonSqueezy redirects here with
  // `?purchase=plus`. The webhook that records the credit races the redirect,
  // so we show a confirming state until quota reflects it, then strip the
  // marker so a refresh doesn't keep showing it.
  const justPurchasedPlus = purchase === 'plus';
  const creditAvailable =
    !!quota && (quota.canCreateFree || quota.canCreateWithCredit);
  const confirmingPurchase = justPurchasedPlus && !creditAvailable;
  useEffect(() => {
    if (justPurchasedPlus && creditAvailable) {
      void navigate({ to: '/dashboard/new', search: {}, replace: true });
      toast.success('Plus credit added');
    }
  }, [justPurchasedPlus, creditAvailable, navigate]);

  const form = useForm<FormValues>({
    resolver: zodResolver(electionCreateSchema),
    defaultValues: {
      name: '',
      slug: '',
      startDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().add(8, 'days').format('YYYY-MM-DD'),
      votingHourStart: 7,
      votingHourEnd: 19,
      template: 'none',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const logoStorageId = await logo.commit();
      const startDate = new Date(values.startDate).getTime();
      const endDate = new Date(values.endDate).getTime();
      const result = await createElection({
        name: values.name,
        slug: values.slug,
        startDate,
        endDate,
        votingHourStart: values.votingHourStart,
        votingHourEnd: values.votingHourEnd,
        template: values.template,
        logoStorageId: logoStorageId ?? undefined,
      });

      await navigate({
        to: '/dashboard/$electionDashboardSlug',
        params: { electionDashboardSlug: result.slug },
      });

      // Fire-and-forget — Inngest scheduling shouldn't block the redirect.
      // Failures are logged server-side and the schedule can be backfilled
      // by editing the election (which re-emits the event).
      const timing = {
        startDate,
        endDate,
        votingHourStart: values.votingHourStart,
        votingHourEnd: values.votingHourEnd,
      };
      void scheduleElectionLifecycleFn({
        data: {
          electionId: result.electionId,
          slug: result.slug,
          startAt: votingStartAt(timing),
          endAt: votingEndAt(timing),
        },
      });
      toast.success('Election created');
    } catch (err) {
      const msg =
        err instanceof ConvexError
          ? (err.data as { message?: string }).message
          : 'Failed to create election';
      toast.error(msg ?? 'Failed to create election');
    }
  }

  const blocked = quota
    ? !quota.canCreateFree && !quota.canCreateWithCredit
    : false;

  return (
    <main className="container mx-auto max-w-xl px-6 py-12">
      {confirmingPurchase ? (
        <PurchaseConfirming />
      ) : (
        blocked && <PlusUpgradePrompt />
      )}
      <Card>
        <CardHeader>
          <CardTitle>Create election</CardTitle>
          <CardDescription>
            Set the basics now — you can edit details and add candidates after.
          </CardDescription>
          {quota && quota.canCreateWithCredit && (
            <p className="text-sm text-emerald-600 dark:text-emerald-500">
              Using 1 of your {quota.plusCredits} Plus credit
              {quota.plusCredits === 1 ? '' : 's'}.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <ImageUpload
                label="Election logo (optional)"
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
                    <FormLabel>Election name</FormLabel>
                    <FormControl>
                      <Input placeholder="Spring 2026 Election" {...field} />
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
                      <Input placeholder="spring-2026" {...field} />
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="votingHourStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voting starts at</FormLabel>
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
                      <FormLabel>Voting ends at</FormLabel>
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
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position template</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="min-w-74">
                        <SelectItem value="none">No template</SelectItem>
                        <SelectItem value="ssg">
                          Supreme Student Government (SSG)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Pre-populates positions. You can add or remove later.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={form.formState.isSubmitting || blocked}
                className="w-full"
              >
                {form.formState.isSubmitting ? 'Creating…' : 'Create election'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}

function PurchaseConfirming() {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 dark:border-emerald-800">
      <Loader2 className="size-5 shrink-0 animate-spin text-emerald-600 dark:text-emerald-500" />
      <div>
        <p className="font-medium">Confirming your purchase…</p>
        <p className="text-sm text-muted-foreground">
          This usually takes a few seconds. The form unlocks as soon as your
          Plus credit lands.
        </p>
      </div>
    </div>
  );
}

function PlusUpgradePrompt() {
  const createPlusCheckout = useAction(api.billing.createPlusCheckout);
  const [pending, setPending] = useState(false);

  async function handleBuy() {
    setPending(true);
    try {
      const { url } = await createPlusCheckout({});
      window.location.href = url;
    } catch (err) {
      const msg =
        err instanceof ConvexError
          ? (err.data as { message?: string }).message
          : 'Checkout failed';
      toast.error(msg ?? 'Checkout failed');
      setPending(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border-2 border-dashed border-emerald-500/50 p-6 dark:border-emerald-800">
      <h2 className="text-lg font-semibold">You've used your free election</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Each account gets one free election. Purchase Plus to add another — each
        Plus credit unlocks one extra election. See the{' '}
        <Link to="/pricing" className="underline">
          pricing page
        </Link>{' '}
        for details.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={handleBuy} disabled={pending} size="lg">
          {pending ? 'Opening checkout…' : 'Get Plus'}
          <Plus className="size-4" />
        </Button>
        <Button render={<Link to="/pricing" />} variant="outline" size="lg">
          See pricing
          <Rocket className="size-4" />
        </Button>
      </div>
    </div>
  );
}
