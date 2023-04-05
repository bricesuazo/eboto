import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { positionTemplate } from "../../../constants";
import { takenSlugs } from "../../../constants";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const electionRouter = createTRPCRouter({
  vote: protectedProcedure
    .input(
      z.object({
        electionId: z.string(),
        votes: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUniqueOrThrow({
        where: {
          id: input.electionId,
        },
      });

      const existingVotes = await ctx.prisma.vote.findMany({
        where: {
          voterId: ctx.session.user.id,
          electionId: election.id,
        },
      });

      if (existingVotes.length > 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You have already voted in this election",
        });
      }

      await ctx.prisma.voter.findFirstOrThrow({
        where: {
          userId: ctx.session.user.id,
          electionId: election.id,
        },
      });

      return ctx.prisma.vote.createMany({
        data: input.votes.map((vote) => {
          const [positionId, candidateId] = vote.split("-");
          return {
            candidateId: candidateId === "abstain" ? null : candidateId,
            positionId:
              positionId === "abstain"
                ? null
                : candidateId !== "abstain"
                ? null
                : positionId,
            voterId: ctx.session.user.id,
            electionId: election.id,
          };
        }),
      });
    }),
  getElectionVoting: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      return ctx.prisma.position.findMany({
        where: {
          electionId: input,
        },
        include: {
          candidate: {
            include: {
              partylist: true,
            },
          },
        },
      });
    }),
  getElectionRealtime: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      return ctx.prisma.position.findMany({
        where: {
          electionId: input,
        },
        include: {
          vote: {
            include: {
              position: {
                include: {
                  _count: true,
                },
              },
            },
          },
          candidate: {
            include: {
              partylist: {
                select: {
                  acronym: true,
                },
              },
              vote: {
                include: {
                  candidate: {
                    include: {
                      _count: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }),
  getElectionSettings: protectedProcedure
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

      return ctx.prisma.election.findUnique({
        where: {
          slug: input,
        },
      });
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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election not found",
        });
      }

      if (
        !election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not a commissioner of this election",
        });
      }

      const invitedVoter = await ctx.prisma.invitedVoter.findMany({
        where: {
          electionId: election.id,
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
        voters: z
          .array(
            z.object({
              id: z.string(),
              email: z.string(),
              status: z.enum(["ACCEPTED", "INVITED", "DECLINED", "ADDED"]),
            })
          )
          .parse(
            voters
              .map((voter) => ({
                id: voter.id,
                email: voter.user.email,
                status: "ACCEPTED",
              }))
              .concat(
                invitedVoter.map((voter) => ({
                  id: voter.id,
                  email: voter.email,
                  status: voter.status,
                }))
              )
          ),
        election,
      };
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
      const invitedVoters = await ctx.prisma.invitedVoter.aggregate({
        where: {
          electionId: election.id,
          status: "INVITED",
        },
        _count: {
          _all: true,
        },
      });
      const declinedVoters = await ctx.prisma.invitedVoter.aggregate({
        where: {
          electionId: election.id,
          status: "DECLINED",
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
      const partylists = await ctx.prisma.partylist.aggregate({
        where: {
          electionId: election.id,
        },
        _count: {
          _all: true,
        },
      });

      return {
        election,
        voters,
        voted,
        partylists,
        positions,
        candidates,
        invitedVoters,
        declinedVoters,
      };
    }),
  getBySlug: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
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
  getMyElectionsVote: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.election.findMany({
      where: {
        publicity: {
          not: "PRIVATE",
        },
        voters: {
          some: {
            userId: ctx.session.user.id,
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
  getElectionData: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUnique({
        where: {
          slug: input,
        },
      });

      if (election) {
        switch (election.publicity) {
          case "PUBLIC":
            return ctx.prisma.election.findUnique({
              where: {
                slug: input,
              },
              include: {
                positions: true,
                candidates: true,
                partylists: true,
              },
            });
          case "VOTER":
            if (ctx.session) {
              const isVoter = await ctx.prisma.election.findFirst({
                where: {
                  slug: input,
                  voters: {
                    some: {
                      userId: ctx.session.user.id,
                    },
                  },
                },
              });

              if (isVoter) {
                return ctx.prisma.election.findUnique({
                  where: {
                    slug: input,
                  },
                  include: {
                    positions: true,
                    candidates: true,
                    partylists: true,
                  },
                });
              }
            }
            break;
          case "PRIVATE":
            if (ctx.session) {
              const isCommissioner = await ctx.prisma.election.findFirst({
                where: {
                  slug: input,
                  commissioners: {
                    some: {
                      userId: ctx.session.user.id,
                    },
                  },
                },
              });

              if (isCommissioner) {
                return ctx.prisma.election.findUnique({
                  where: {
                    slug: input,
                  },
                  include: {
                    positions: true,
                    candidates: true,
                    partylists: true,
                  },
                });
              }
            }
        }
      }
      throw new Error("Election not found");
    }),
  getElectionVotingPageData: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      return ctx.prisma.position.findMany({
        where: {
          electionId: input,
        },
        include: {
          candidate: {
            include: {
              partylist: true,
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
      if (takenSlugs.includes(input.slug.trim().toLowerCase())) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Election slug is already exists",
        });
      }

      const isElectionExists = await ctx.prisma.election.findUnique({
        where: {
          slug: input.slug,
        },
      });

      if (isElectionExists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Election slug is already exists",
        });
      }

      const newElection = await ctx.prisma.election.create({
        data: {
          name: input.name,
          slug: input.slug.trim().toLowerCase(),
          start_date: input.start_date,
          end_date: input.end_date,
          voting_start: input.voting_start ? input.voting_start : undefined,
          voting_end: input.voting_end ? input.voting_end : undefined,
          commissioners: {
            create: {
              userId: ctx.session.user.id,
            },
          },
          partylists: {
            create: {
              name: "Independent",
              acronym: "IND",
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

      return newElection;
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        start_date: z.date(),
        end_date: z.date(),
        voting_start: z.number(),
        voting_end: z.number(),
        publicity: z.enum(["PUBLIC", "VOTER", "PRIVATE"]),
        logo: z.string().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUnique({
        where: {
          id: input.id,
        },
        include: {
          commissioners: true,
        },
      });

      if (!election) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election not found",
        });
      }

      if (
        !election.commissioners.some(
          (commissioner) => commissioner.userId === ctx.session.user.id
        )
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a commissioner of this election",
        });
      }

      if (input.slug !== election.slug) {
        if (takenSlugs.includes(input.slug.trim().toLowerCase())) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Election slug is already exists",
          });
        }

        const isElectionExists = await ctx.prisma.election.findUnique({
          where: {
            slug: input.slug,
          },
        });

        if (isElectionExists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Election slug is already exists",
          });
        }
      }

      return await ctx.prisma.election.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          slug: input.slug.trim().toLowerCase(),
          start_date: input.start_date,
          end_date: input.end_date,
          voting_start: input.voting_start,
          voting_end: input.voting_end,
          publicity: input.publicity,
          logo: input.logo,
        },
      });
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
