import { db } from "@eboto-mo/db";
import { TRPCError } from "@trpc/server";
import { getSession } from "next-auth/react";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  getUser: publicProcedure.query(async ({ ctx }) => {
    return (
      (await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, ctx.session?.user.id ?? ""),
      })) ?? null
    );
  }),
  getSession: publicProcedure.query(() => getSession()),
  test: publicProcedure.mutation(async ({ ctx }) => {
    return crypto.randomUUID();
  }),
});

export const authCaller = authRouter.createCaller({
  db,
  session: await getSession(),
});
