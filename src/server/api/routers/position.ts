import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const positionRouter = createTRPCRouter({
  createSingle: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        electionId: z.string().min(1),
        order: z.number().min(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.position.create({
        data: {
          name: input.name,
          electionId: input.electionId,
          order: input.order,
        },
      });
    }),
  editSingle: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const position = await ctx.prisma.position.findUniqueOrThrow({
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
        !position.election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      )
        throw new Error("Unauthorized");

      return ctx.prisma.position.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
        },
      });
    }),
  deleteSingle: protectedProcedure
    .input(z.string().min(1))
    .mutation(async ({ input, ctx }) => {
      const position = await ctx.prisma.position.findUniqueOrThrow({
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
        !position.election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      )
        throw new Error("Unauthorized");

      return ctx.prisma.position.delete({
        where: {
          id: input,
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

      const positions = await ctx.prisma.position.findMany({
        where: {
          electionId: election.id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return { positions, election };
    }),
});
