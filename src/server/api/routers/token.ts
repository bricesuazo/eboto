import { protectedProcedure } from "./../trpc";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const tokenRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const token = await ctx.prisma.verificationToken.findFirst({
        where: {
          id: input,
          OR: [
            {
              invitedVoter: {
                email: ctx.session.user.email,
              },
            },
            {
              invitedCommissioner: {
                email: ctx.session.user.email,
              },
            },
          ],
        },
        include: {
          invitedVoter: true,
          invitedCommissioner: true,
        },
      });

      if (!token) {
        throw new Error("Invalid token");
      }

      if (token.expiresAt < new Date()) {
        throw new Error("Token expired");
      }

      return token;
    }),
  verify: publicProcedure
    .input(
      z.object({
        type: z.enum(["EMAIL_VERIFICATION", "PASSWORD_RESET"]),
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

      switch (input.type) {
        case "EMAIL_VERIFICATION":
          if (!token.userId) return;

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
          return "EMAIL_VERIFICATION";

        case "PASSWORD_RESET":
          await ctx.prisma.verificationToken.deleteMany({
            where: {
              userId: token.userId,
              type: input.type,
            },
          });
          return "PASSWORD_RESET";
      }
    }),
});
