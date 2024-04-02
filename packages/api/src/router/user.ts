import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        // firstName: z.string(),
        // middleName: z.string().nullable(),
        // lastName: z.string(),
        image: z
          .object({
            name: z.string().min(1),
            type: z.string().min(1),
            base64: z.string().min(1),
          })
          .nullish(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.db.image_path && (input.image === null || input.image)) {
        await ctx.supabase.storage
          .from("users")
          .remove([ctx.user.db.image_path]);
      }

      const { data, error } = await ctx.supabase
        .from("users")
        .update({
          //   first_name: input.firstName,
          //   middle_name: input.middleName,
          //   last_name: input.lastName,
          name: input.name,
          image_path: input.image
            ? await fetch(input.image.base64)
                .then((res) => res.blob())
                .then(async (blob) => {
                  const { data } = await ctx.supabase.storage
                    .from("users")
                    .upload(`${ctx.user.auth.id}/avatar/${Date.now()}`, blob);

                  return data?.path;
                })
            : input.image,
        })
        .eq("id", ctx.user.auth.id)
        .select()
        .single();

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      let image_url: string | null = null;

      if (data.image_path) {
        const { data: image } = ctx.supabase.storage
          .from("users")
          .getPublicUrl(data.image_path);

        image_url = image.publicUrl;
      }

      return { ...data, image_url };
    }),

  deleteAccount: protectedProcedure.mutation(() => {
    // TODO:
    // await ctx.db.transaction(async (db) => {
    //   const user = await db.query.users.findFirst({
    //     where: (users, { eq }) => eq(users.id, ctx.session.user.id),
    //   });

    //   if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    //   const account = await db.query.accounts.findFirst({
    //     where: (accounts, { eq }) => eq(accounts.userId, ctx.session.user.id),
    //   });

    //   if (!account) throw new TRPCError({ code: "NOT_FOUND" });

    //   await db.insert(deleted_users).values(user);
    //   await db.insert(deleted_accounts).values({
    //     ...account,
    //     deletedUserId: user.id,
    //   });

    //   await db.delete(users).where(eq(users.id, ctx.session.user.id));
    //   await db.delete(accounts).where(eq(accounts.userId, ctx.session.user.id));
    // });

    return true;
  }),

  //   checkPassword: protectedProcedure
  //     .input(
  //       z.object({
  //         password: z
  //           .string()
  //           .min(8, "Password must be at least 8 characters long"),
  //       }),
  //     )
  //     .mutation(async ({ input, ctx }) => {
  //       const user = await ctx.db.query.users.findFirst({
  //         where: (users, { eq }) => eq(users.id, ctx.session.user.id),
  //       });

  //       if (!user) throw new TRPCError({ code: "NOT_FOUND" });

  //       if (!user.password) {
  //         throw new TRPCError({
  //           code: "UNAUTHORIZED",
  //           message: "Password is not set",
  //         });
  //       }

  //       const isPasswordValid = await bcrypt.compare(
  //         input.password,
  //         user.password,
  //       );

  //       if (!isPasswordValid) {
  //         throw new TRPCError({
  //           code: "UNAUTHORIZED",
  //           message: "Incorrect password",
  //         });
  //       }

  //       return true;
  //     }),
  //   changePassword: protectedProcedure
  //     .input(
  //       z.object({
  //         oldPassword: z.string(),
  //         newPassword: z
  //           .string()
  //           .min(8, "Password must be at least 8 characters long"),
  //       }),
  //     )
  //     .mutation(async ({ input, ctx }) => {
  //       const user = await ctx.prisma.user.findUniqueOrThrow({
  //         where: {
  //           id: ctx.session.user.id,
  //         },
  //       });

  //       if (!user.password) {
  //         throw new TRPCError({
  //           code: "UNAUTHORIZED",
  //           message: "Password is not set",
  //         });
  //       }

  //       const isPasswordValid = await bcrypt.compare(
  //         input.oldPassword,
  //         user.password,
  //       );

  //       if (!isPasswordValid) {
  //         throw new TRPCError({
  //           code: "UNAUTHORIZED",
  //           message: "Invalid password",
  //         });
  //       }

  //       await ctx.prisma.user.update({
  //         where: {
  //           id: user.id,
  //         },
  //         data: {
  //           password: await bcrypt.hash(input.newPassword, 12),
  //         },
  //       });
  //     }),
  //   invitation: protectedProcedure
  //     .input(
  //       z.object({
  //         tokenId: z.string(),
  //         isAccepted: z.boolean(),
  //       }),
  //     )
  //     .mutation(async ({ input, ctx }) => {
  //       const token = await ctx.prisma.verificationToken.findFirst({
  //         where: {
  //           id: input.tokenId,
  //           type: "ELECTION_INVITATION",
  //           OR: [
  //             {
  //               invitedVoter: {
  //                 email: ctx.session.user.email,
  //               },
  //             },
  //             {
  //               invitedCommissioner: {
  //                 email: ctx.session.user.email,
  //               },
  //             },
  //           ],
  //         },
  //         include: {
  //           invitedVoter: true,
  //           invitedCommissioner: true,
  //         },
  //       });

  //       if (!token) {
  //         throw new Error("Invalid token");
  //       }

  //       if (token.expiresAt < new Date()) {
  //         throw new Error("Token expired");
  //       }

  //       if (input.isAccepted) {
  //         if (token.invitedVoter) {
  //           await ctx.prisma.voter.create({
  //             data: {
  //               userId: ctx.session.user.id,
  //               electionId: token.invitedVoter.electionId,
  //               field: token.invitedVoter.field as Prisma.JsonObject,
  //             },
  //           });

  //           await ctx.prisma.invitedVoter.delete({
  //             where: {
  //               id: token.invitedVoter.id,
  //             },
  //           });
  //         } else if (token.invitedCommissioner) {
  //           await ctx.prisma.commissioner.create({
  //             data: {
  //               userId: ctx.session.user.id,
  //               electionId: token.invitedCommissioner.electionId,
  //             },
  //           });

  //           await ctx.prisma.invitedCommissioner.delete({
  //             where: {
  //               id: token.invitedCommissioner.id,
  //             },
  //           });
  //         }
  //       } else {
  //         await ctx.prisma.verificationToken.update({
  //           where: {
  //             id: input.tokenId,
  //           },
  //           data: token.invitedVoter
  //             ? {
  //                 invitedVoter: {
  //                   update: {
  //                     status: "DECLINED",
  //                   },
  //                 },
  //               }
  //             : token.invitedCommissioner
  //             ? {
  //                 invitedCommissioner: {
  //                   update: {
  //                     status: "DECLINED",
  //                   },
  //                 },
  //               }
  //             : {},
  //         });

  //         await ctx.prisma.verificationToken.delete({
  //           where: {
  //             id: input.tokenId,
  //           },
  //         });
  //       }

  //       return true;
  //     }),
  //   resetPassword: publicProcedure
  //     .input(
  //       z.object({
  //         token: z.string(),
  //         password: z
  //           .string()
  //           .min(8, "Password must be at least 8 characters long"),
  //       }),
  //     )
  //     .mutation(async ({ input, ctx }) => {
  //       const token = await ctx.prisma.verificationToken.findFirst({
  //         where: {
  //           id: input.token,
  //           type: "PASSWORD_RESET",
  //         },
  //       });

  //       if (!token || !token.userId) {
  //         throw new Error("Invalid token");
  //       }

  //       if (token.expiresAt < new Date()) {
  //         throw new Error("Token expired");
  //       }

  //       await ctx.prisma.user.update({
  //         where: {
  //           id: token.userId,
  //         },
  //         data: {
  //           password: await bcrypt.hash(input.password, 12),
  //         },
  //       });

  //       await ctx.prisma.verificationToken.delete({
  //         where: {
  //           id: token.id,
  //         },
  //       });
  //     }),
  //   requestResetPassword: publicProcedure
  //     .input(z.string().email())
  //     .mutation(async ({ input, ctx }) => {
  //       await ctx.prisma.verificationToken.deleteMany({
  //         where: {
  //           user: {
  //             email: input,
  //           },
  //           type: "PASSWORD_RESET",
  //         },
  //       });

  //       const user = await ctx.prisma.user.findUniqueOrThrow({
  //         where: {
  //           email: input,
  //         },
  //       });

  //       if (!user.emailVerified) {
  //         await sendEmail({
  //           type: "EMAIL_VERIFICATION",
  //           email: user.email,
  //           userId: user.id,
  //         });
  //         throw new TRPCError({
  //           code: "UNAUTHORIZED",
  //           message:
  //             "Email is not verified. Please verify your email first. We have sent you a new verification email.",
  //         });
  //       }

  //       await sendEmail({
  //         type: "PASSWORD_RESET",
  //         email: user.email,
  //         userId: user.id,
  //       });
  //     }),
  //   signUp: publicProcedure
  //     .input(
  //       z.object({
  //         email: z.string().email(),
  //         password: z
  //           .string()
  //           .min(8, "Password must be at least 8 characters long"),
  //         first_name: z.string(),
  //         last_name: z.string(),
  //         middle_name: z.string().nullish(),
  //       }),
  //     )
  //     .mutation(async ({ input, ctx }) => {
  //       const isUserExists = await ctx.prisma.user.findUnique({
  //         where: {
  //           email: input.email,
  //         },
  //       });

  //       if (
  //         isUserExists &&
  //         !isUserExists.password &&
  //         !isUserExists.emailVerified
  //       ) {
  //         await ctx.prisma.user.update({
  //           where: {
  //             id: isUserExists.id,
  //           },
  //           data: {
  //             first_name: input.first_name,
  //             last_name: input.last_name,
  //             password: await bcrypt.hash(input.password, 12),
  //           },
  //         });
  //         await sendEmail({
  //           type: "EMAIL_VERIFICATION",
  //           email: isUserExists.email,
  //           userId: isUserExists.id,
  //         });
  //         return;
  //       }

  //       if (
  //         isUserExists &&
  //         !isUserExists.emailVerified &&
  //         isUserExists.password &&
  //         (await bcrypt.compare(input.password, isUserExists.password))
  //       ) {
  //         await sendEmail({
  //           type: "EMAIL_VERIFICATION",
  //           email: isUserExists.email,
  //           userId: isUserExists.id,
  //         });

  //         throw new Error("Email already exists. Email verification sent");
  //       }

  //       if (isUserExists) {
  //         throw new Error("Email already exists");
  //       }

  //       const user = await ctx.prisma.user.create({
  //         data: {
  //           email: input.email,
  //           password: await bcrypt.hash(input.password, 12),
  //           first_name: input.first_name,
  //           last_name: input.last_name,
  //         },
  //       });

  //       await sendEmail({
  //         type: "EMAIL_VERIFICATION",
  //         email: user.email,
  //         userId: user.id,
  //       });
  //     }),
});
