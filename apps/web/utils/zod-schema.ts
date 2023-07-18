import { publicity } from "@eboto-mo/db/schema";
import { z } from "zod";

export const createElectionSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).trim().toLowerCase(),
  start_date: z.date(),
  end_date: z.date(),
  template: z.number().nonnegative().default(0),
});
export const updateElectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  oldSlug: z.string().trim().toLowerCase().optional(),
  newSlug: z.string().min(1).trim().toLowerCase(),
  start_date: z.date(),
  end_date: z.date(),
  publicity: z.enum(publicity),
  logo: z.string().nullable(),
});
export const createPartylistSchema = z.object({
  name: z.string().min(1),
  acronym: z.string().min(1),
  election_id: z.string().min(1),
});

export const updatePartylistSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  acronym: z.string().min(1),
  election_id: z.string().min(1),
  description: z.string().nullable(),
  logo_link: z.string().nullable(),
});

export type CreateElectionSchema = z.infer<typeof createElectionSchema>;
export type UpdateElectionSchema = z.infer<typeof updateElectionSchema>;
export type CreatePartylistSchema = z.infer<typeof createPartylistSchema>;
export type UpdatePartylistSchema = z.infer<typeof updatePartylistSchema>;
