import { z } from 'zod/v4';

import { EmailSchema } from '@eboto/constants/schema';

const VoterFieldsSchema = z.record(z.string(), z.string());

export const CreateVoterSchema = z.object({
  email: EmailSchema,
  voter_fields: VoterFieldsSchema,
});
export type CreateVoter = z.infer<typeof CreateVoterSchema>;

export const EditVoterSchema = CreateVoterSchema;
export type EditVoter = z.infer<typeof EditVoterSchema>;
