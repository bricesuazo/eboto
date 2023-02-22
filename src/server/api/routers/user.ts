import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendEmail } from "../../../utils/sendEmail";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
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
