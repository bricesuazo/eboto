import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const systemRouter = createTRPCRouter({
  reportProblem: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(3).max(50),
        description: z.string().min(10).max(500),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.reportProblem.create({
        data: {
          subject: input.subject,
          description: input.description,
          userId: ctx.session.user.id,
        },
      });
    }),
});
