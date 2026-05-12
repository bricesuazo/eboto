import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { api } from '@eboto/backend/api';
import { votingEndAt, votingStartAt } from '@eboto/backend/election-timing';

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
import { electionCreateSchema } from '~/lib/schemas/election';
import type { ElectionCreateInput } from '~/lib/schemas/election';
import { useImageUpload } from '~/lib/use-image-upload';

type FormValues = ElectionCreateInput;

export const Route = createFileRoute('/dashboard/new')({
  component: NewElectionPage,
});

function NewElectionPage() {
  const navigate = useNavigate();
  const createElection = useMutation(api.elections.create);
  const logo = useImageUpload();

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
      await navigate({
        to: '/dashboard/$electionDashboardSlug',
        params: { electionDashboardSlug: result.slug },
      });
    } catch (err) {
      const msg =
        err instanceof ConvexError
          ? (err.data as { message?: string }).message
          : 'Failed to create election';
      toast.error(msg ?? 'Failed to create election');
    }
  }

  return (
    <main className="container mx-auto max-w-xl px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Create election</CardTitle>
          <CardDescription>
            Set the basics now — you can edit details and add candidates after.
          </CardDescription>
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
                      <SelectContent>
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
                disabled={form.formState.isSubmitting}
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
