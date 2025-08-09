import type { FileWithPath } from '@mantine/dropzone';
import { z } from 'zod/v4';

import { SlugSchema } from './constants';

export const CreateCandidateSchema = z.object({
  first_name: z.string().min(1, 'First name must be at least 1 characters'),
  middle_name: z.string().nullable(),
  last_name: z.string().min(1, 'Last name must be at least 1 characters'),
  slug: SlugSchema,
  partylist_id: z.string().min(1, 'Please select a partylist'),
  position_id: z.string().min(1, 'Please select a position'),
  image: z.custom<FileWithPath>().nullable(),
  platforms: z.array(
    z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().min(1, 'Description is required').optional(),
    }),
  ),
  achievements: z.array(
    z.object({
      name: z.string().min(1, 'Name is required'),
      year: z.string().min(1, 'Year is required'),
    }),
  ),
  affiliations: z.array(
    z.object({
      org_name: z.string().min(1, 'Organization name is required'),
      org_position: z.string().min(1, 'Position is required'),
      start_year: z.string().min(1, 'Start year is required'),
      end_year: z.string().min(1, 'End year is required'),
    }),
  ),
  events_attended: z.array(
    z.object({
      name: z.string().min(1, 'Name is required'),
      year: z.string().min(1, 'Year is required'),
    }),
  ),
});
export type CreateCandidate = z.infer<typeof CreateCandidateSchema>;

export const EditCandidateSchema = CreateCandidateSchema.omit({
  slug: true,
  image: true,

  platforms: true,
  achievements: true,
  affiliations: true,
  events_attended: true,
}).extend({
  old_slug: SlugSchema,
  new_slug: SlugSchema,
  image: z.string().or(z.custom<FileWithPath>().nullable()),

  platforms: z.array(
    z.object({
      id: z.uuid('ID is required'),
      title: z.string().min(1, 'Title is required'),
      description: z.string().min(1, 'Description is required').optional(),
    }),
  ),
  achievements: z.array(
    z.object({
      id: z.uuid('ID is required'),
      name: z.string().min(1, 'Name is required'),
      year: z.string().min(1, 'Year is required'),
    }),
  ),
  affiliations: z.array(
    z.object({
      id: z.uuid('ID is required'),
      org_name: z.string().min(1, 'Organization name is required'),
      org_position: z.string().min(1, 'Position is required'),
      start_year: z.string().min(1, 'Start year is required'),
      end_year: z.string().min(1, 'End year is required'),
    }),
  ),
  events_attended: z.array(
    z.object({
      id: z.uuid('ID is required'),
      name: z.string().min(1, 'Name is required'),
      year: z.string().min(1, 'Year is required'),
    }),
  ),
});

export type EditCandidate = z.infer<typeof EditCandidateSchema>;
