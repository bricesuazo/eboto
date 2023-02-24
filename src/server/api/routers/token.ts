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
          switch (input.accountType) {
            case "VOTER":
              await ctx.prisma.invitedVoter.update({
                where: {
                  id: token.userId,
                },
                data: {
                  status: input.status,
                },
              });
              break;
            case "COMMISSIONER":
              await ctx.prisma.invitedCommissioner.update({
                where: {
                  id: token.userId,
                },
                data: {
                  status: input.status,
                },
              });
              break;
          }

          await ctx.prisma.verificationToken.deleteMany({
            where: {
              userId: token.userId,
              type: input.type,
            },
          });
          break;
      }

      return true;
    }),
});
