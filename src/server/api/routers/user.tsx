import { render } from "@react-email/render";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendEmail } from "../../../../emails";

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
        include: {
          temporaryUser: true,
        },
      });

      if (!token || token.type !== "EMAIL_VERIFICATION") {
        throw new Error("Invalid token");
      }

      if (token.expiresAt < new Date()) {
        throw new Error("Token expired");
      }

      if (!token.temporaryUser) {
        throw new Error("Invalid token");
      }

      await ctx.prisma.user.create({
        data: {
          email: token.temporaryUser.email,
          password: token.temporaryUser.password,
          first_name: token.temporaryUser.first_name,
          last_name: token.temporaryUser.last_name,
          emailVerified: new Date(),
        },
      });

      await ctx.prisma.temporaryUser.delete({
        where: {
          id: token.temporaryUser.id,
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
      const isTempUserExists = await ctx.prisma.temporaryUser.findUnique({
        where: {
          email: input.email,
        },
      });

      if (isTempUserExists) {
        const token = await ctx.prisma.token.create({
          data: {
            type: "EMAIL_VERIFICATION",
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 3), // 3 hours
            temporaryUserId: isTempUserExists.id,
          },
          select: {
            id: true,
          },
        });

        await sendEmail({
          email: input.email,
          subject: "Verify your email",
          html: render(<html>Test1212</html>),
        });

        throw new Error("Email already exists. Email verification sent");
      }

      const isUserExists = await ctx.prisma.user.findUnique({
        where: {
          email: input.email,
        },
      });
      if (isUserExists) {
        throw new Error("Email already exists");
      }

      const tempUser = await ctx.prisma.temporaryUser.create({
        data: {
          email: input.email,
          password: await bcrypt.hash(input.password, 12),
          first_name: input.first_name,
          last_name: input.last_name,
        },
      });

      const token = await ctx.prisma.token.create({
        data: {
          type: "EMAIL_VERIFICATION",
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 3), // 3 hours
          temporaryUserId: tempUser.id,
        },
        select: {
          id: true,
        },
      });

      await sendEmail({
        email: input.email,
        subject: "Verify your email",
        html: render(<html>Test</html>),
      });
    }),

  // getAll: publicProcedure.query(({ ctx }) => {
  //   return ctx.prisma.example.findMany();
  // }),

  // getSecretMessage: protectedProcedure.query(() => {
  //   return "you can now see this secret message!";
  // }),
});
