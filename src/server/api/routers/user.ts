import  bcrypt  from 'bcryptjs';

import { z } from "zod";

import { createTRPCRouter, publicProcedure,  } from "../trpc";

export const userRouter = createTRPCRouter({
    signUp: publicProcedure
        .input(z.object({ email: z.string().email(), password: z.string(), first_name: z.string(), last_name: z.string(), middle_name: z.string().nullish() }))
        .mutation(async ({ input, ctx }) => {
            const isUserExists = await ctx.prisma.user.findUnique({
                where: {
                    email: input.email,
                },
            });
            if (isUserExists) {
                throw new Error("Email already exists");
            }

            return await ctx.prisma.user.create({
                data: {
                    email: input.email,
                    password: await bcrypt.hash(input.password, 12),
                    first_name: input.first_name,
                    last_name: input.last_name,
                    middle_name: input.middle_name,
                },
            });
        }),



  // getAll: publicProcedure.query(({ ctx }) => {
  //   return ctx.prisma.example.findMany();
  // }),

  // getSecretMessage: protectedProcedure.query(() => {
  //   return "you can now see this secret message!";
  // }),
});
