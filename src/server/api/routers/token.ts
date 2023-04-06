import { protectedProcedure } from "./../trpc";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const tokenRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const token = await ctx.prisma.verificationToken.findFirst({
        where: {
          id: input,
          type: "ELECTION_INVITATION",
          OR: [
            {
              invitedVoterId: ctx.session.user.id,
            },
            {
              invitedCommissionerId: ctx.session.user.id,
            },
          ],
        },
        include: {
          invitedVoter: true,
          invitedCommissioner: true,
        },
      });

      if (!token) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token not found",
        });
      }

      if (!token.invitedVoter && !token.invitedCommissioner) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token not found",
        });
      }

      if (token.expiresAt < new Date()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Token expired",
        });
      }

      const election = await ctx.prisma.election.findFirstOrThrow({
        where: {
          OR: [
            {
              invitedVoter: {
                some: {
                  id: token.invitedVoter?.id,
                },
              },
            },
            {
              invitedCommissioner: {
                some: {
                  id: token.invitedCommissioner?.id,
                },
              },
            },
          ],
        },
      });

      return { token, election };
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
          return "PASSWORD_RESET";
      }
    }),
});
