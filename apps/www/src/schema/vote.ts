import { z } from 'zod/v4';

export const VoteSchema = z.record(
  z.string(),
  z.object({
    votes: z.array(z.string()),
    min: z.number(),
    max: z.number(),
    isValid: z.boolean(),
  }),
);
export type Vote = z.infer<typeof VoteSchema>;
