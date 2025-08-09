import { z } from 'zod/v4';

export const CreatePositionSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name must be at least 1 characters')
      .max(50, 'Name must be at most 50 characters'),
    isSingle: z.boolean(),
    min: z.number().min(0, 'Minimum must be at least 0'),
    max: z.number().min(1, 'Maximum must be at least 1'),
  })
  .refine((data) => data.min <= data.max, {
    path: ['max'],
    message: 'Maximum must be greater than minimum',
  })
  .refine((data) => !(data.isSingle && data.max === 1), {
    path: ['max'],
    message: 'Maximum must be greater than 1',
  });
export type CreatePosition = z.infer<typeof CreatePositionSchema>;

export const EditPositionSchema = CreatePositionSchema;
export type EditPosition = z.infer<typeof EditPositionSchema>;
