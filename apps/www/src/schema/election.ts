import { z } from 'zod/v4';

import { SlugSchema } from '@eboto/constants/schema';

import { Constants } from '../../../../supabase/types';

export const CreateElectionSchema = z.object({
  name: z.string().min(1, 'Election name must be at least 1 characters'),

  slug: SlugSchema.min(1, 'Election slug must be at least 1 characters').max(
    24,
    'Election slug must be at most 24 characters',
  ),
  date: z
    .custom<[string | null, string | null]>()
    .refine(
      (value) =>
        value[0] &&
        value[1] &&
        new Date(value[0]).getTime() <= new Date(value[1]).getTime(),
      'Start date must be before end date',
    )
    .refine(
      (value) =>
        value[0] &&
        value[1] &&
        new Date(value[1]).getTime() >= new Date(value[0]).getTime(),
      'End date must be after start date',
    )
    .refine(
      (value) =>
        value[0] &&
        value[1] &&
        new Date(value[1]).getTime() > new Date().getTime(),
      'End date must be in the future',
    )
    .refine(
      (value) => !!value[0] || !!value[1],
      'Please select an election start and end date',
    ),
  template: z.string().min(1, 'Please select an election template'),
  voting_hours: z
    .custom<[number, number]>()
    .refine(
      (value) => value[0] < value[1],
      'Start hour must be before end hour',
    ),
});

export type CreateElection = z.infer<typeof CreateElectionSchema>;

export const UpdateElectionSchema = z.object({
  name: z.string().min(1, 'Election name must be at least 1 characters'),
  description: z.string(),
  is_candidates_visible_in_realtime_when_ongoing: z.boolean(),
  newSlug: SlugSchema.min(1, 'Election slug must be at least 1 characters').max(
    24,
    'Election slug must be at most 24 characters',
  ),
  publicity: z.enum(Constants.public.Enums.publicity),
  logo: z.instanceof(File).or(z.string()).nullable(),
  date: z
    .custom<[string | null, string | null]>()
    .refine(
      (value) => !!value[0] || !!value[1],
      'Please select an election start and end date',
    )
    .refine(
      (value) =>
        !value[0] ||
        !value[1] ||
        new Date(value[0]).getTime() <= new Date(value[1]).getTime(),
      'Start date must be before end date',
    )
    .refine(
      (value) =>
        !value[0] ||
        !value[1] ||
        new Date(value[1]).getTime() >= new Date(value[0]).getTime(),
      'End date must be after start date',
    )
    .refine(
      (value) =>
        !value[0] ||
        !value[1] ||
        new Date(value[1]).getTime() > new Date().getTime(),
      'End date must be in the future',
    ),
  voting_hours: z
    .custom<[number, number]>()
    .refine(
      (value) => value[0] < value[1],
      'Start hour must be before end hour',
    ),
});
export type UpdateElection = z.infer<typeof UpdateElectionSchema>;
