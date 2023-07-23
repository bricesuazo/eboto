/**
 * This file contains the root router of your tRPC-backend
 */
import { cookies } from 'next/headers';

import { publicProcedure, router } from '../trpc';
import { authRouter } from './auth';
import { electionRouter } from './election';

export const appRouter = router({
  election: electionRouter,
  auth: authRouter,
  toggleTheme: publicProcedure.mutation(async () => {
    cookies().get('theme') && cookies().get('theme').value === 'dark'
      ? cookies().set('theme', 'light')
      : cookies().set('theme', 'dark');
  }),
});

export type AppRouter = typeof appRouter;
