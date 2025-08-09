import { z } from 'zod/v4';

import { EmailSchema } from './constants';

export const CreateVoterSchema = z.object({
  email: EmailSchema,
});
export type CreateVoter = z.infer<typeof CreateVoterSchema>;

export const EditVoterSchema = CreateVoterSchema.and(
  z.record(z.string(), z.string()),
);
export type EditVoter = z.infer<typeof EditVoterSchema>;
