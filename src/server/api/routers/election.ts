import { z } from "zod";
import { positionTemplate } from "../../../constants";
import { takenSlugs } from "../../../constants";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const electionRouter = createTRPCRouter({
  createVoter: protectedProcedure
    .input(
      z.object({
        electionId: z.string(),
        email: z.string().email(),
        firstName: z.string(),
        lastName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUnique({
        where: {
          id: input.electionId,
        },
        include: {
          commissioners: true,
        },
      });

      if (!election) {
        throw new Error("Election not found");
      }

      if (
        !election.commissioners.some(
          (commissioner) => commissioner.id === ctx.session.user.id
        )
      ) {
        throw new Error("You are not a commissioner of this election");
      }

      const isVoterExists = await ctx.prisma.user.findFirst({
        where: {
          email: input.email,
          voters: {
            some: {
              id: input.electionId,
            },
          },
        },
      });

      if (isVoterExists) {
        throw new Error("User is already a voter of this election");
      }

      const isUserExists = await ctx.prisma.user.findUnique({
        where: {
          email: input.email,
        },
      });

      if (!isUserExists) {
        return ctx.prisma.user.create({
          data: {
            email: input.email,
            first_name: input.firstName,
            last_name: input.lastName,
            voters: {
              connect: {
                id: input.electionId,
              },
            },
          },
        });
      }

      return ctx.prisma.user.update({
        where: {
          email: input.email,
        },
        data: {
          voters: {
            connect: {
              id: input.electionId,
            },
          },
        },
      });
    }),
  getElectionOverview: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findFirst({
        where: {
          slug: input,
          AND: {
            commissioners: {
              some: {
                id: ctx.session.user.id,
              },
            },
          },
        },
      });

      if (!election) {
        throw new Error("Election not found");
      }

      const voters = await ctx.prisma.user.aggregate({
        where: {
          voters: {
            some: {
              id: election.id,
            },
          },
        },
        _count: {
          _all: true,
        },
      });

      const voted = await ctx.prisma.user.aggregate({
        where: {
          voters: {
            some: {
              id: election.id,
            },
          },
          vote: {
            some: {
              electionId: election.id,
            },
          },
        },
        _count: {
          _all: true,
        },
      });

      const positions = await ctx.prisma.position.aggregate({
        where: {
          electionId: election.id,
        },
        _count: {
          _all: true,
        },
      });
      const candidates = await ctx.prisma.candidate.aggregate({
        where: {
          electionId: election.id,
        },
        _count: {
          _all: true,
        },
      });

      return { election, voters, voted, positions, candidates };
    }),
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
  getMyElectionsVote: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.election.findMany({
      where: {
        publicity: {
          not: "PRIVATE",
        },
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
        template: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (takenSlugs.includes(input.slug)) {
        throw new Error("Election slug is unavailable. Try another.");
      }

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
          slug: true,
        },
      });

      if (input.template !== 0)
        await ctx.prisma.position.createMany({
          data:
            positionTemplate
              .find((template) => template.id === input.template)
              ?.positions.map((position, index) => ({
                name: position,
                electionId: newElection.id,
                order: index,
              })) || [],
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
      return newElection;
    }),
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUnique({
        where: {
          id: input,
        },
        include: {
          commissioners: true,
        },
      });

      if (!election) {
        throw new Error("Election not found");
      }

      if (
        !election.commissioners.some(
          (commissioner) => commissioner.id === ctx.session.user.id
        )
      ) {
        throw new Error("You are not a commissioner of this election");
      }

      // await ctx.prisma.user.update({
      //   where: {
      //     id: ctx.session.user.id,
      //   },
      //   data: {
      //     commissioners: {
      //       disconnect: {
      //         id: input,
      //       },
      //     },
      //   },
      // });

      // disconnect all of the voters with has election to their voters

      await ctx.prisma.election.delete({
        where: {
          id: input,
        },
      });

      return true;
    }),
});
