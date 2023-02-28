import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const partylistRouter = createTRPCRouter({
  editSingle: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        acronym: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.acronym.trim().toUpperCase() === "IND")
        throw new Error(
          "IND is reserved for independent partylist. Please use another acronym"
        );

      const partylist = await ctx.prisma.partylist.findUniqueOrThrow({
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
        !partylist.election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      )
        throw new Error("Unauthorized");

      const partylistWithSameAcronym = await ctx.prisma.partylist.findUnique({
        where: {
          acronym: input.acronym,
        },
      });

      if (partylistWithSameAcronym) throw new Error("Acronym already exists");

      return ctx.prisma.partylist.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          acronym: input.acronym,
        },
      });
    }),
  deleteSingle: protectedProcedure
    .input(z.string().min(1))
    .mutation(async ({ input, ctx }) => {
      const partylist = await ctx.prisma.partylist.findUniqueOrThrow({
        where: {
          id: input,
        },
        include: {
          election: {
            select: {
              id: true,
              commissioners: true,
            },
          },
        },
      });

      if (
        !partylist.election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      )
        throw new Error("Unauthorized");

      if (partylist.acronym.trim().toUpperCase() === "IND")
        throw new Error("Cannot delete independent partylist");

      return ctx.prisma.partylist.delete({
        where: {
          id: input,
        },
      });
    }),

  createSingle: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        acronym: z.string().min(1),
        electionId: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.acronym.trim().toUpperCase() === "IND")
        throw new Error("IND is reserved for independent partylist");

      return ctx.prisma.partylist.create({
        data: {
          name: input.name,
          acronym: input.acronym,
          electionId: input.electionId,
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
          slug: true,
          commissioners: true,
        },
      });

      if (
        !election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      )
        throw new Error("Unauthorized");

      const partylists = await ctx.prisma.partylist.findMany({
        where: {
          electionId: election.id,
          acronym: {
            not: "IND",
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return { partylists, election };
    }),
});
