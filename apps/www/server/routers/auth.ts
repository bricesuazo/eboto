import { db } from '@eboto-mo/db';
import { TRPCError } from '@trpc/server';
import { getSession } from 'next-auth/react';
import { z } from 'zod';

import { privateProcedure, publicProcedure, router } from '../trpc';

export const authRouter = router({
  getUser: publicProcedure.query(({ ctx }) =>
    db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, ctx.session.user.id),
    }),
  ),
  getSession: publicProcedure.query(({ ctx }) => getSession()),
});
