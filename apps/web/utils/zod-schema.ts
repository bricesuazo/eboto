import { z } from "zod";

export const createElectionSchema = z.object({
  name: z.string(),
  slug: z.string(),
  start_date: z.date(),
  end_date: z.date(),
  voting_start: z.number().nullish(),
  voting_end: z.number().nullish(),
  template: z.number(),
});

export type CreateElectionSchema = z.infer<typeof createElectionSchema>;
