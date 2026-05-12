import { z } from 'zod';

export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export const slugField = z
  .string()
  .min(1, 'Required')
  .toLowerCase()
  .regex(SLUG_REGEX, 'Lowercase letters, digits, dashes only');
