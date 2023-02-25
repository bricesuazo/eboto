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
          if (!token.invitedVoterId) {
            throw new Error("Invalid token");
          }
          switch (input.accountType) {
            case "VOTER":
              await ctx.prisma.invitedVoter.update({
                where: {
                  id: token.invitedVoterId,
                },
                data: {
                  status: input.status,
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
