import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(({ ctx }) => ctx.session),
  getSessionProtected: protectedProcedure.query(({ ctx }) => ctx.session),
});
