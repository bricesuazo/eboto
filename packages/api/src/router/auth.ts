import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  getUser: publicProcedure.query(async ({ ctx }) => {
    return (
      (await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, ctx.session?.user.id ?? ""),
      })) ?? null
    );
  }),
  getSession: protectedProcedure.query(({ ctx }) => ctx.session),
});
