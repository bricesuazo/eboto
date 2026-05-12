import { z } from 'zod';

import { isSlugReserved } from '@eboto/backend/slugs';

import { slugField } from './_shared';

export const electionFields = {
  name: z.string().min(1, 'Required'),
  slug: slugField.refine((s) => !isSlugReserved(s), 'That slug is reserved'),
  description: z.string(),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required'),
  votingHourStart: z.number().int().min(0).max(23),
  votingHourEnd: z.number().int().min(0).max(23),
  publicity: z.enum(['PRIVATE', 'VOTER', 'PUBLIC']),
  nameArrangement: z.number().int().min(0).max(1),
  isCandidatesVisibleInRealtimeWhenOngoing: z.boolean(),
  template: z.string(),
} as const;

const datesValid = (d: Record<string, unknown>) =>
  new Date(d.endDate as string) > new Date(d.startDate as string);

type DateHourShape = z.ZodRawShape & {
  startDate: z.ZodString;
  endDate: z.ZodString;
  votingHourStart: z.ZodNumber;
  votingHourEnd: z.ZodNumber;
};

const withDateHourRefinements = <Shape extends DateHourShape>(
  schema: z.ZodObject<Shape>,
) =>
  schema.refine(datesValid, {
    path: ['endDate'],
    message: 'End must be after start',
  });

export const electionCreateSchema = withDateHourRefinements(
  z.object({
    name: electionFields.name,
    slug: electionFields.slug,
    startDate: electionFields.startDate,
    endDate: electionFields.endDate,
    votingHourStart: electionFields.votingHourStart,
    votingHourEnd: electionFields.votingHourEnd,
    template: electionFields.template,
  }),
);

export const electionSettingsSchema = withDateHourRefinements(
  z.object({
    name: electionFields.name,
    slug: electionFields.slug,
    description: electionFields.description,
    startDate: electionFields.startDate,
    endDate: electionFields.endDate,
    votingHourStart: electionFields.votingHourStart,
    votingHourEnd: electionFields.votingHourEnd,
    publicity: electionFields.publicity,
    nameArrangement: electionFields.nameArrangement,
    isCandidatesVisibleInRealtimeWhenOngoing:
      electionFields.isCandidatesVisibleInRealtimeWhenOngoing,
  }),
);

export type ElectionCreateInput = z.infer<typeof electionCreateSchema>;
export type ElectionSettingsInput = z.infer<typeof electionSettingsSchema>;
