import { z } from 'zod';

export const partylistSchema = z.object({
  name: z.string().min(1, 'Required'),
  acronym: z.string().min(1, 'Required').max(10, 'Max 10 characters'),
  description: z.string().optional(),
});

export type PartylistInput = z.infer<typeof partylistSchema>;
