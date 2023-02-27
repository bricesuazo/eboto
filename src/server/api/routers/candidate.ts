import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const candidateRouter = createTRPCRouter({
  editSingle: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const election = await ctx.prisma.position.findUniqueOrThrow({
        where: {
          id: input.id,
        },
        select: {
          election: {
            select: {
              id: true,
              commissioners: true,
            },
          },
        },
      });

      if (
        !election.election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      )
        throw new Error("Unauthorized");

      // return ctx.prisma.candidate.update({
      //   where: {
      //     id: input.id,
      //   },
      //   data: {
      //     first_name: input.firstName,
      //     last_name: input.lastName,
      //   },
      // });
    }),
  deleteSingle: protectedProcedure
    .input(z.string().min(1))
    .mutation(async ({ input, ctx }) => {
      const candidate = await ctx.prisma.candidate.findUniqueOrThrow({
        where: {
          id: input,
        },
        select: {
          election: {
            select: {
              id: true,
              commissioners: true,
            },
          },
        },
      });

      if (
        !candidate.election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      )
        throw new Error("Unauthorized");

      return ctx.prisma.candidate.delete({
        where: {
          id: input,
        },
      });
    }),

  createSingle: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        slug: z.string().min(1),
        electionId: z.string().min(1),
        positionId: z.string().min(1),
        partylistId: z.string().min(1),

        middleName: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        image: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUniqueOrThrow({
        where: {
          id: input.electionId,
        },
        select: {
          id: true,
          commissioners: true,
        },
      });

      if (
        !election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      )
        throw new Error("Unauthorized");

      return ctx.prisma.candidate.create({
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          slug: input.slug,
          electionId: election.id,
          partylistId: input.partylistId,
          positionId: input.positionId,

          middle_name: input.middleName,
          description: input.description,
          image: input.image,
        },
      });
    }),
  getAll: protectedProcedure
    .input(z.string().min(1))
    .query(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUniqueOrThrow({
        where: {
          slug: input,
        },
        select: {
          id: true,
          commissioners: true,
        },
      });

      if (
        !election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      )
        throw new Error("Unauthorized");

      const candidates = await ctx.prisma.candidate.findMany({
        where: {
          electionId: election.id,
        },
        orderBy: {
          position: {
            order: "asc",
          },
        },
      });

      return { candidates, election };
    }),
});
