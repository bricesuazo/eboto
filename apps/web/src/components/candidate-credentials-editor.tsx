import { useEffect } from 'react';
import { convexQuery } from '@convex-dev/react-query';
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

interface FormValues {
  platforms: { title: string; description: string }[];
  achievements: { name: string; year: string }[];
  affiliations: {
    orgName: string;
    orgPosition: string;
    startYear: string;
    endYear: string;
  }[];
  eventsAttended: { name: string; year: string }[];
}

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

  const form = useForm<FormValues>({ defaultValues: EMPTY });
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
            {achievements.fields.map((f, i) => (
              <div
                key={f.id}
                className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_120px_auto]"
              >
                <Input
                  placeholder="Achievement"
                  {...form.register(`achievements.${i}.name`)}
                />
                <Input
                  placeholder="Year"
                  {...form.register(`achievements.${i}.year`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => achievements.remove(i)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
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
            {affiliations.fields.map((f, i) => (
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
                  <Input
                    placeholder="Start year"
                    {...form.register(`affiliations.${i}.startYear`)}
                  />
                  <Input
                    placeholder="End year"
                    {...form.register(`affiliations.${i}.endYear`)}
                  />
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
            ))}
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
            {eventsAttended.fields.map((f, i) => (
              <div
                key={f.id}
                className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_120px_auto]"
              >
                <Input
                  placeholder="Event / seminar"
                  {...form.register(`eventsAttended.${i}.name`)}
                />
                <Input
                  placeholder="Year"
                  {...form.register(`eventsAttended.${i}.year`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => eventsAttended.remove(i)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
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
