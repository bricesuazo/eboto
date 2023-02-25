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
        status: z.enum(["ACCEPTED", "DECLINED"]).optional(),
        accountType: z.enum(["VOTER", "COMMISSIONER"]).optional(),
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
          await ctx.prisma.verificationToken.deleteMany({
            where: {
              userId: token.userId,
              type: input.type,
            },
          });
          break;
        case "ELECTION_INVITATION":
          switch (input.accountType) {
            case "VOTER":
              if (!token.invitedVoterId) {
                throw new Error("Invalid token");
              }
              const isVoterExists = await ctx.prisma.invitedVoter.findFirst({
                where: {
                  tokens: {
                    some: {
                      id: token.id,
                    },
                  },
                },
              });

              if (!isVoterExists) {
                throw new Error("Invalid token");
              }

              await ctx.prisma.invitedVoter.update({
                where: {
                  id: isVoterExists.id,
                },
                data: {
                  status: input.status,
                },
              });

              await ctx.prisma.verificationToken.deleteMany({
                where: {
                  invitedVoterId: isVoterExists.id,
                  type: "ELECTION_INVITATION",
                },
              });

              break;
            case "COMMISSIONER":
              if (!token.invitedCommissionerId) {
                throw new Error("Invalid token");
              }
              await ctx.prisma.invitedCommissioner.update({
                where: {
                  id: token.invitedCommissionerId,
                },
                data: {
                  status: input.status,
                },
              });
              break;
          }
      }

      return true;
    }),
});
