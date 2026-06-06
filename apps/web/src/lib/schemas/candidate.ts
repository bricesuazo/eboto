import { z } from 'zod';

import { slugField } from './_shared';

export const candidateSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Required'),
  slug: slugField,
  positionId: z.string().min(1, 'Required'),
  partylistId: z.string().min(1, 'Required'),
});

export type CandidateInput = z.infer<typeof candidateSchema>;
