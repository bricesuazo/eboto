import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const tokenRouter = createTRPCRouter({
  verify: publicProcedure
    .input(
      z.object({
        type: z.enum([
          "EMAIL_VERIFICATION",
          "PASSWORD_RESET",
          "ELECTION_INVITATION",
        ]),
        token: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const token = await ctx.prisma.verificationToken.findFirst({
        where: {
          id: input.token,
          type: input.type,
        },
      });

      if (!token) {
        throw new Error("Invalid token");
      }

      if (token.expiresAt < new Date()) {
        throw new Error("Token expired");
      }

      await ctx.prisma.user.update({
        where: {
          id: token.userId,
        },
        data: {
          emailVerified: new Date(),
        },
      });

      await ctx.prisma.verificationToken.deleteMany({
        where: {
          userId: token.userId,
          type: input.type,
        },
      });
    }),
});
