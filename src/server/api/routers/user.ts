import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendEmail } from "../../../utils/sendEmail";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  invitation: protectedProcedure
    .input(
      z.object({
        tokenId: z.string(),
        isAccepted: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const token = await ctx.prisma.verificationToken.findFirst({
        where: {
          id: input.tokenId,
          type: "ELECTION_INVITATION",
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

      if (input.isAccepted) {
        if (token.invitedVoter) {
          await ctx.prisma.voter.create({
            data: {
              userId: ctx.session.user.id,
              electionId: token.invitedVoter.electionId,
            },
          });

          await ctx.prisma.invitedVoter.delete({
            where: {
              id: token.invitedVoter.id,
            },
          });
        } else if (token.invitedCommissioner) {
          await ctx.prisma.commissioner.create({
            data: {
              userId: ctx.session.user.id,
              electionId: token.invitedCommissioner.electionId,
            },
          });

          await ctx.prisma.invitedCommissioner.delete({
            where: {
              id: token.invitedCommissioner.id,
            },
          });
        }
      } else {
        await ctx.prisma.verificationToken.update({
          where: {
            id: input.tokenId,
          },
          data: token.invitedVoter
            ? {
                invitedVoter: {
                  update: {
                    status: "DECLINED",
                  },
                },
              }
            : token.invitedCommissioner
            ? {
                invitedCommissioner: {
                  update: {
                    status: "DECLINED",
                  },
                },
              }
            : {},
        });

        await ctx.prisma.verificationToken.delete({
          where: {
            id: input.tokenId,
          },
        });
      }

      return true;
    }),
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        password: z
          .string()
          .min(8, "Password must be at least 8 characters long"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const token = await ctx.prisma.verificationToken.findFirst({
        where: {
          id: input.token,
          type: "PASSWORD_RESET",
        },
      });

      if (!token || !token.userId) {
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
          password: await bcrypt.hash(input.password, 12),
        },
      });

      await ctx.prisma.verificationToken.delete({
        where: {
          id: token.id,
        },
      });
    }),
  requestResetPassword: publicProcedure
    .input(z.string().email())
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: {
          email: input,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      await sendEmail({
        type: "PASSWORD_RESET",
        email: user.email,
        userId: user.id,
      });
    }),
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z
          .string()
          .min(8, "Password must be at least 8 characters long"),
        first_name: z.string(),
        last_name: z.string(),
        middle_name: z.string().nullish(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const isUserExists = await ctx.prisma.user.findUnique({
        where: {
          email: input.email,
        },
      });

      if (
        isUserExists &&
        !isUserExists.password &&
        !isUserExists.emailVerified
      ) {
        await ctx.prisma.user.update({
          where: {
            id: isUserExists.id,
          },
          data: {
            first_name: input.first_name,
            last_name: input.last_name,
            password: await bcrypt.hash(input.password, 12),
          },
        });
        await sendEmail({
          type: "EMAIL_VERIFICATION",
          email: isUserExists.email,
          userId: isUserExists.id,
        });
        return;
      }

      if (
        isUserExists &&
        !isUserExists.emailVerified &&
        isUserExists.password &&
        (await bcrypt.compare(input.password, isUserExists.password))
      ) {
        await sendEmail({
          type: "EMAIL_VERIFICATION",
          email: isUserExists.email,
          userId: isUserExists.id,
        });

        throw new Error("Email already exists. Email verification sent");
      }

      if (isUserExists) {
        throw new Error("Email already exists");
      }

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          password: await bcrypt.hash(input.password, 12),
          first_name: input.first_name,
          last_name: input.last_name,
        },
      });

      await sendEmail({
        type: "EMAIL_VERIFICATION",
        email: user.email,
        userId: user.id,
      });
    }),
});
