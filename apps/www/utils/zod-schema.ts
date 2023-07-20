import { publicity } from "@eboto-mo/db/schema";
import { z } from "zod";

export const createElectionSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).trim().toLowerCase(),
  start_date: z.date(),
  end_date: z.date(),
  template: z.number().nonnegative().default(0),
});
export const editElectionSchema = z.object({
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

export const editPartylistSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  oldAcronym: z.string().optional(),
  newAcronym: z.string().min(1),
  election_id: z.string().min(1),
  description: z.string().nullable(),
  logo_link: z.string().nullable(),
});
export const createPositionSchema = z.object({
  name: z.string().min(1),
  order: z.number().nonnegative(),
  min: z.number().nonnegative().optional(),
  max: z.number().nonnegative().optional(),
  election_id: z.string().min(1),
});

export const editPositionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number().nonnegative(),
  min: z.number().nonnegative().optional(),
  max: z.number().nonnegative().optional(),
  election_id: z.string().min(1),
});

export const createCandidateSchema = z.object({
  slug: z.string().min(1).trim().toLowerCase(),
  first_name: z.string().min(1),
  middle_name: z.string().nullable(),
  last_name: z.string().min(1),
  election_id: z.string().min(1),
  position_id: z.string().min(1),
  partylist_id: z.string().min(1),
  image_link: z.string().nullable(),
});

export type CreateElectionSchema = z.infer<typeof createElectionSchema>;
export type EditElectionSchema = z.infer<typeof editElectionSchema>;
export type CreatePartylistSchema = z.infer<typeof createPartylistSchema>;
export type EditPartylistSchema = z.infer<typeof editPartylistSchema>;
export type CreatePositionSchema = z.infer<typeof createPositionSchema>;
export type EditPositionSchema = z.infer<typeof editPositionSchema>;
export type CreateCandidateSchema = z.infer<typeof createCandidateSchema>;
