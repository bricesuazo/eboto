import { z } from 'zod/v4';

export const GetPlusSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1'),
});
export type GetPlus = z.infer<typeof GetPlusSchema>;
