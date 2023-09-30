import { createTRPCRouter, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  getUser: publicProcedure.query(async ({ ctx }) => {
    return (
      (await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, ctx.session?.user.id ?? ""),
      })) ?? null
    );
  }),
  getSession: publicProcedure.query(({ ctx }) => ctx.session),
  getTest: publicProcedure.query(() => "test"),
  test: publicProcedure.mutation(() => ""),
});
