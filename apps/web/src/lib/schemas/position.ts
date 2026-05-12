import { z } from 'zod';

export const positionSchema = z
  .object({
    name: z.string().min(1, 'Required'),
    description: z.string().optional(),
    min: z.coerce.number().int().min(0),
    max: z.coerce.number().int().min(1),
  })
  .refine((d) => d.min <= d.max, {
    path: ['min'],
    message: 'Min must be ≤ max',
  });

export type PositionInput = z.infer<typeof positionSchema>;
