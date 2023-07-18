import { publicity } from "@eboto-mo/db/schema";
import { z } from "zod";

export const createElectionSchema = z.object({
  name: z.string(),
  slug: z.string().trim().toLowerCase(),
  start_date: z.date(),
  end_date: z.date(),
  template: z.number().nonnegative().default(0),
});
export const updateElectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  oldSlug: z.string().trim().toLowerCase().optional(),
  newSlug: z.string().trim().toLowerCase(),
  start_date: z.date(),
  end_date: z.date(),
  publicity: z.enum(publicity),
  logo: z.string().nullable(),
});

export type CreateElectionSchema = z.infer<typeof createElectionSchema>;
export type UpdateElectionSchema = z.infer<typeof updateElectionSchema>;
