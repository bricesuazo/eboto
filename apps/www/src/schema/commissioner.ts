import { z } from 'zod/v4';

import { EmailSchema } from './constants';

export const AddCommissionerSchema = z.object({
  email: EmailSchema,
});
export type AddCommissioner = z.infer<typeof AddCommissionerSchema>;
