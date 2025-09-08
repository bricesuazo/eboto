import { z } from 'zod/v4';

import { EmailSchema } from '@eboto/constants/schema';

export const AuthSchema = z.object({
  email: EmailSchema,
});
export type Auth = z.infer<typeof AuthSchema>;
