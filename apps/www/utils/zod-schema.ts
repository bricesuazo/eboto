import { account_status_type, publicity } from '@eboto-mo/db/schema';
import { z } from 'zod';

export const account_status_type_with_accepted = [
  ...account_status_type,
  'ACCEPTED',
] as const;
