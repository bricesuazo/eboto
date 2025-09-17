import { z } from 'zod/v4';

export const CreatePartylistSchema = z.object({
  name: z
    .string()
    .min(1, 'Name must be at least 1 characters')
    .max(100, 'Name must be at most 100 characters'),
  acronym: z
    .string()
    .min(1, 'Acronym must be at least 1 characters')
    .max(24, 'Acronym must be at most 24 characters'),
});
export type CreatePartylist = z.infer<typeof CreatePartylistSchema>;

export const EditPartylistSchema = CreatePartylistSchema.omit({
  acronym: true,
}).extend({
  id: z.uuid(),
  election_id: z.uuid(),
  oldAcronym: z.string(),
  newAcronym: z.string(),
  description: z.string().optional(),
});
export type EditPartylist = z.infer<typeof EditPartylistSchema>;
