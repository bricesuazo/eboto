import { z } from 'zod/v4';

import { EmailSchema } from '@eboto/constants/schema';

export const ContactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: EmailSchema,
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message should be at least 10 characters long'),
});
export type ContactForm = z.infer<typeof ContactFormSchema>;
