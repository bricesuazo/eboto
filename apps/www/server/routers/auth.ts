import { authOptions } from "@/lib/auth";
import { db } from "@eboto-mo/db";
import { TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { privateProcedure, publicProcedure, router } from "../trpc";

export const authRouter = router({
  getUser: publicProcedure.query(async ({ ctx }) => {
    return (
      (await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, ctx.session?.user.id ?? ""),
      })) ?? null
    );
  }),
  getSession: publicProcedure.query(() => getServerSession(authOptions)),
  test: privateProcedure.mutation(async ({ ctx }) => {
    return crypto.randomUUID();
  }),
});
