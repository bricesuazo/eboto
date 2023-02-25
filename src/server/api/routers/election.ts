import { z } from "zod";
import { positionTemplate } from "../../../constants";
import { takenSlugs } from "../../../constants";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const electionRouter = createTRPCRouter({
  invitation: protectedProcedure
    .input(
      z.object({
        tokenId: z.string(),
        status: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const token = await ctx.prisma.verificationToken.findFirst({
        where: {
          id: input.tokenId,
          type: "ELECTION_INVITATION",
          OR: [
            {
              invitedVoter: {
                email: ctx.session.user.email,
              },
            },
            {
              invitedCommissioner: {
                email: ctx.session.user.email,
              },
            },
          ],
        },
        include: {
          invitedVoter: true,
          invitedCommissioner: true,
        },
      });

      if (!token) {
        throw new Error("Invalid token");
      }

      if (token.expiresAt < new Date()) {
        throw new Error("Token expired");
      }

      if (input.status) {
        if (token.invitedVoter) {
          await ctx.prisma.voter.create({
            data: {
              userId: ctx.session.user.id,
              electionId: token.invitedVoter.electionId,
            },
          });

          await ctx.prisma.invitedVoter.delete({
            where: {
              id: token.invitedVoter.id,
            },
          });
        } else if (token.invitedCommissioner) {
          await ctx.prisma.commissioner.create({
            data: {
              userId: ctx.session.user.id,
              electionId: token.invitedCommissioner.electionId,
            },
          });

          await ctx.prisma.invitedCommissioner.delete({
            where: {
              id: token.invitedCommissioner.id,
            },
          });
        }
      } else {
        await ctx.prisma.verificationToken.update({
          where: {
            id: input.tokenId,
          },
          data: token.invitedVoter
            ? {
                invitedVoter: {
                  update: {
                    status: "DECLINED",
                  },
                },
              }
            : token.invitedCommissioner
            ? {
                invitedCommissioner: {
                  update: {
                    status: "DECLINED",
                  },
                },
              }
            : {},
        });

        await ctx.prisma.verificationToken.delete({
          where: {
            id: input.tokenId,
          },
        });
      }

      return true;
    }),
  getElectionVoter: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUnique({
        where: {
          slug: input,
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
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      ) {
        throw new Error("You are not a commissioner of this election");
      }

      const invitedVoter = await ctx.prisma.invitedVoter.findMany({
        where: {
          electionId: election.id,
        },
        include: {
          election: {
            include: {
              voters: true,
            },
          },
        },
      });

      const voters = await ctx.prisma.voter.findMany({
        where: {
          electionId: election.id,
        },
        include: {
          user: true,
        },
      });

      return {
        invitedVoter,
        voters,
      };
    }),
  createVoter: protectedProcedure
    .input(
      z.object({
        electionId: z.string(),
        email: z.string().email(),
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
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      ) {
        throw new Error("You are not a commissioner of this election");
      }

      const isVoterExistsInElection = await ctx.prisma.invitedVoter.findFirst({
        where: {
          email: input.email,
          electionId: input.electionId,
        },
      });

      if (isVoterExistsInElection) {
        throw new Error("Email is already a voter of this election");
      }

      // TODO: Check if email is the email of this session user. Then just connect the voter to the user
      if (ctx.session.user.email === input.email) {
        return await ctx.prisma.voter.create({
          data: {
            userId: ctx.session.user.id,
            electionId: input.electionId,
          },
        });
      }

      return await ctx.prisma.invitedVoter.create({
        data: {
          email: input.email,
          electionId: input.electionId,
          tokens: {
            create: {
              type: "ELECTION_INVITATION",
              expiresAt: election.end_date,
            },
          },
        },
      });
    }),
  removeVoter: protectedProcedure
    .input(
      z.object({
        electionId: z.string(),
        voterId: z.string(),
        isInvitedVoter: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Add middleware for checking if user is a commissioner of the election
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
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      ) {
        throw new Error("You are not a commissioner of this election");
      }

      await ctx.prisma.verificationToken.deleteMany({
        where: {
          invitedVoterId: input.voterId,
          userId: input.voterId,
          type: "ELECTION_INVITATION",
        },
      });

      if (input.isInvitedVoter) {
        await ctx.prisma.invitedVoter.delete({
          where: {
            id: input.voterId,
          },
        });
      } else {
        await ctx.prisma.voter.delete({
          where: {
            id: input.voterId,
          },
        });
      }

      return true;
    }),

  getElectionOverview: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findFirst({
        where: {
          slug: input,
          commissioners: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!election) {
        throw new Error("Election not found");
      }

      const voters = await ctx.prisma.voter.aggregate({
        where: {
          electionId: election.id,
        },
        _count: {
          _all: true,
        },
      });

      const voted = await ctx.prisma.voter.aggregate({
        where: {
          electionId: election.id,
          user: {
            votes: {
              some: {
                electionId: election.id,
              },
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
            userId: ctx.session.user.id,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
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
        // publicity: {
        //   not: "PRIVATE",
        // },
        voters: {
          some: {
            userId: ctx.session.user.id,
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
        },

        select: {
          id: true,
          slug: true,
        },
      });

      await ctx.prisma.commissioner.create({
        data: {
          electionId: newElection.id,
          userId: ctx.session.user.id,
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
          (commissioner) => commissioner.userId === ctx.session.user.id
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
