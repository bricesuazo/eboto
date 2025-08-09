import { z } from 'zod/v4';

export const IdSchema = z.uuid().min(1, 'ID is required');

export const SlugSchema = z
  .string()
  .regex(
    /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/,
    'Slug must be alphanumeric and can contain dashes',
  );

export const EmailSchema = z.email('Invalid email address');
