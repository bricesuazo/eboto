import bcrypt from "bcryptjs";
import { z } from "zod";
import SendEmailVerification from "../../../libs/SendEmailVerification";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  verifyEmail: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const token = await ctx.prisma.token.findUnique({
        where: {
          id: input.token,
        },
      });

      if (!token || token.type !== "EMAIL_VERIFICATION") {
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

      await ctx.prisma.token.deleteMany({
        where: {
          userId: token.userId,
          type: "EMAIL_VERIFICATION",
        },
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
      if (isUserExists && !isUserExists.emailVerified) {
        await SendEmailVerification({
          email: isUserExists.email,
          userId: isUserExists.id,
        });

        throw new Error("Email already exists. Email verification sent");
      }

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          password: await bcrypt.hash(input.password, 12),
          first_name: input.first_name,
          last_name: input.last_name,
        },
      });

      await SendEmailVerification({
        email: user.email,
        userId: user.id,
      });
    }),
});
