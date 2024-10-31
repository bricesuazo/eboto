'use client';

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '../types';
import { env } from '../env';

export const createClient = () => {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
};
