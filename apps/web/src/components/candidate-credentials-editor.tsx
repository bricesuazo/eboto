import { useEffect } from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { api } from '@eboto/backend/api';
import type { Id } from '@eboto/backend/data-model';

import { Button } from '~/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Textarea } from '~/components/ui/textarea';
import type { CandidateCredentialsInput } from '~/lib/schemas/candidate-credentials';
import { candidateCredentialsSchema } from '~/lib/schemas/candidate-credentials';
import { cn } from '~/lib/utils';

type FormValues = CandidateCredentialsInput;

const EMPTY: FormValues = {
  platforms: [],
  achievements: [],
  affiliations: [],
  eventsAttended: [],
};

export function CandidateCredentialsEditor({
  candidateId,
  candidateName,
  onClose,
}: {
  candidateId: Id<'candidates'>;
  candidateName: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery(
    convexQuery(api.candidates.getCredentials, { candidateId }),
  );
  const update = useMutation(api.candidates.updateCandidateCredentials);

  const form = useForm<FormValues>({
    defaultValues: EMPTY,
    resolver: zodResolver(candidateCredentialsSchema),
    // Show errors while typing once the field has been blurred once, so
    // commissioners get immediate feedback while fixing a year typo.
    mode: 'onBlur',
  });
  // Reset the form whenever the server data lands. `defaultValues` only
  // applies on mount, so without `reset` the field arrays stay empty.
  useEffect(() => {
    if (data) form.reset(data);
  }, [data, form]);

  const platforms = useFieldArray({ control: form.control, name: 'platforms' });
  const achievements = useFieldArray({
    control: form.control,
    name: 'achievements',
  });
  const affiliations = useFieldArray({
    control: form.control,
    name: 'affiliations',
  });
  const eventsAttended = useFieldArray({
    control: form.control,
    name: 'eventsAttended',
  });

  async function onSubmit(values: FormValues) {
    try {
      await update({ candidateId, ...values });
      toast.success('Credentials saved');
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
    <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-2xl">
      <DialogHeader className="shrink-0 border-b px-6 py-6">
        <DialogTitle>Edit credentials — {candidateName}</DialogTitle>
        <DialogDescription>
          Platforms, achievements, affiliations, and events attended. These
          appear on the public candidate page.
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <Tabs
          defaultValue="platforms"
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <TabsList className="mx-6 mt-4 grid shrink-0 grid-cols-4">
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="affiliations">Affiliations</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent
            value="platforms"
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4"
          >
            {platforms.fields.map((f, i) => (
              <div key={f.id} className="space-y-2 rounded-md border p-3">
                <Input
                  placeholder="Title"
                  {...form.register(`platforms.${i}.title`)}
                />
                <Textarea
                  rows={3}
                  placeholder="Description (optional)"
                  {...form.register(`platforms.${i}.description`)}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => platforms.remove(i)}
                  >
                    <Trash2 className="mr-1 size-4" /> Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => platforms.append({ title: '', description: '' })}
            >
              <Plus className="mr-1 size-4" /> Add platform
            </Button>
          </TabsContent>

          <TabsContent
            value="achievements"
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4"
          >
            {achievements.fields.map((f, i) => {
              const yearError =
                form.formState.errors.achievements?.[i]?.year?.message;
              return (
                <div
                  key={f.id}
                  className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_120px_auto] sm:items-start"
                >
                  <Input
                    placeholder="Achievement"
                    {...form.register(`achievements.${i}.name`)}
                  />
                  <div>
                    <Input
                      placeholder="Year"
                      inputMode="numeric"
                      maxLength={4}
                      className={cn(yearError && 'border-destructive')}
                      {...form.register(`achievements.${i}.year`)}
                    />
                    {yearError && (
                      <p className="mt-1 text-xs text-destructive">
                        {yearError}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => achievements.remove(i)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => achievements.append({ name: '', year: '' })}
            >
              <Plus className="mr-1 size-4" /> Add achievement
            </Button>
          </TabsContent>

          <TabsContent
            value="affiliations"
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4"
          >
            {affiliations.fields.map((f, i) => {
              const startError =
                form.formState.errors.affiliations?.[i]?.startYear?.message;
              const endError =
                form.formState.errors.affiliations?.[i]?.endYear?.message;
              return (
                <div key={f.id} className="space-y-2 rounded-md border p-3">
                  <Input
                    placeholder="Organization"
                    {...form.register(`affiliations.${i}.orgName`)}
                  />
                  <Input
                    placeholder="Position"
                    {...form.register(`affiliations.${i}.orgPosition`)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        placeholder="Start year"
                        inputMode="numeric"
                        maxLength={4}
                        className={cn(startError && 'border-destructive')}
                        {...form.register(`affiliations.${i}.startYear`)}
                      />
                      {startError && (
                        <p className="mt-1 text-xs text-destructive">
                          {startError}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input
                        placeholder="End year (blank = ongoing)"
                        inputMode="numeric"
                        maxLength={4}
                        className={cn(endError && 'border-destructive')}
                        {...form.register(`affiliations.${i}.endYear`)}
                      />
                      {endError && (
                        <p className="mt-1 text-xs text-destructive">
                          {endError}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => affiliations.remove(i)}
                    >
                      <Trash2 className="mr-1 size-4" /> Remove
                    </Button>
                  </div>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                affiliations.append({
                  orgName: '',
                  orgPosition: '',
                  startYear: '',
                  endYear: '',
                })
              }
            >
              <Plus className="mr-1 size-4" /> Add affiliation
            </Button>
          </TabsContent>

          <TabsContent
            value="events"
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4"
          >
            {eventsAttended.fields.map((f, i) => {
              const yearError =
                form.formState.errors.eventsAttended?.[i]?.year?.message;
              return (
                <div
                  key={f.id}
                  className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_120px_auto] sm:items-start"
                >
                  <Input
                    placeholder="Event / seminar"
                    {...form.register(`eventsAttended.${i}.name`)}
                  />
                  <div>
                    <Input
                      placeholder="Year"
                      inputMode="numeric"
                      maxLength={4}
                      className={cn(yearError && 'border-destructive')}
                      {...form.register(`eventsAttended.${i}.year`)}
                    />
                    {yearError && (
                      <p className="mt-1 text-xs text-destructive">
                        {yearError}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => eventsAttended.remove(i)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => eventsAttended.append({ name: '', year: '' })}
            >
              <Plus className="mr-1 size-4" /> Add event
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || isLoading}
          >
            {form.formState.isSubmitting ? 'Saving…' : 'Save credentials'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
