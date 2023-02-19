import { z } from "zod";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const electionRouter = createTRPCRouter({
  getBySlug: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    return ctx.prisma.election.findUnique({
      where: {
        slug: input,
      },
    });
  }),
  getMyElections: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.election.findMany({
      where: {
        commissioners: {
          some: {
            id: ctx.session.user.id,
          },
        },
      },
    });
  }),
  getElectionData: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      return ctx.prisma.election.findUnique({
        where: {
          slug: input,
        },
        include: {
          candidates: true,
          positions: true,
          partylist: true,
        },
      });
    }),
  getMyElectionVotes: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.election.findMany({
      where: {
        voters: {
          some: {
            id: ctx.session.user.id,
          },
        },
      },
      include: {
        vote: {
          where: {
            voterId: ctx.session.user.id,
          },
        },
      },
    });
  }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        slug: z.string(),
        start_date: z.date(),
        end_date: z.date(),
        voting_start: z.number().nullish(),
        voting_end: z.number().nullish(),
        template: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const isElectionExists = await ctx.prisma.election.findUnique({
        where: {
          slug: input.slug,
        },
      });

      if (isElectionExists) {
        throw new Error("Election slug is already exists");
      }

      const newElection = await ctx.prisma.election.create({
        data: {
          name: input.name,
          slug: input.slug,
          start_date: input.start_date,
          end_date: input.end_date,
          voting_start: input.voting_start ? input.voting_start : undefined,
          voting_end: input.voting_end ? input.voting_end : undefined,
          commissioners: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
        select: {
          id: true,
        },
      });

      await ctx.prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          commissioners: {
            connect: {
              id: newElection.id,
            },
          },
        },
      });
      return true;
    }),
});
