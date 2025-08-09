import { z } from 'zod/v4';

export const CreateAdminMessageSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});
export type CreateAdminMessage = z.infer<typeof CreateAdminMessageSchema>;

export const ChatSchema = z.object({
  message: z.string().min(3, 'Message must be at least 3 characters'),
});
export type Chat = z.infer<typeof ChatSchema>;
