import { createTRPCRouter, protectedProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  getSession: protectedProcedure.query(({ ctx }) => ctx.session),
});
