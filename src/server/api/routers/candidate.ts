import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const candidateRouter = createTRPCRouter({
  editSingle: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        slug: z.string(),
        electionId: z.string(),
        partylistId: z.string(),
        positionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const position = await ctx.prisma.position.findUniqueOrThrow({
        where: {
          id: input.positionId,
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

      const candidate = await ctx.prisma.candidate.findFirst({
        where: {
          slug: input.slug,
          electionId: position.election.id,
          NOT: {
            id: input.id,
          },
        },
      });

      if (candidate) throw new Error("Candidate's slug already exists");

      return ctx.prisma.candidate.update({
        where: {
          id: input.id,
        },
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          slug: input.slug.trim().toLowerCase(),
          electionId: position.election.id,
          partylistId: input.partylistId,
          positionId: input.positionId,
        },
      });
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
        position: z.object({
          id: z.string().min(1),
          electionId: z.string().min(1),
        }),
        partylistId: z.string().min(1),

        middleName: z.string().nullable(),
        description: z.string().min(1).optional(),
        image: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUniqueOrThrow({
        where: {
          id: input.position.electionId,
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

      const candidate = await ctx.prisma.candidate.findFirst({
        where: {
          slug: input.slug,
          electionId: election.id,
        },
      });

      if (candidate) throw new Error("Candidate's slug already exists");

      return ctx.prisma.candidate.create({
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          slug: input.slug.trim().toLowerCase(),
          electionId: election.id,
          partylistId: input.partylistId,
          positionId: input.position.id,

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

      const positions = await ctx.prisma.position.findMany({
        where: {
          electionId: election.id,
        },
        orderBy: {
          order: "asc",
        },
      });
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
      const partylists = await ctx.prisma.partylist.findMany({
        where: {
          electionId: election.id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return { candidates, election, positions, partylists };
    }),
});
