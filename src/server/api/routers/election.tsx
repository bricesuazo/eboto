import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { positionTemplate } from "../../../constants";
import { takenSlugs } from "../../../constants";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { supabase } from "../../../lib/supabase";
import ReactPDF from "@react-pdf/renderer";
import GenerateResult from "../../../pdf/GenerateResult";
import { isElectionOngoing } from "../../../utils/isElectionOngoing";
import { sendEmailTransport } from "../../../../emails";
import { render } from "@react-email/render";
import VoteCasted from "../../../../emails/VoteCasted";

export const electionRouter = createTRPCRouter({
  deleteSingleVoterField: protectedProcedure
    .input(
      z.object({
        electionId: z.string(),
        voterFieldId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUnique({
        where: {
          id: input.electionId,
        },
      });

      if (!election)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election not found",
        });

      if (isElectionOngoing({ election, withTime: true }))
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Election is ongoing",
        });

      if (election.end_date < new Date())
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Election is already finished",
        });

      await ctx.prisma.voterField.delete({
        where: {
          id: input.voterFieldId,
        },
      });
    }),

  updateVoterField: protectedProcedure
    .input(
      z.object({
        electionId: z.string(),
        field: z.array(z.object({ id: z.string(), name: z.string() })),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUnique({
        where: {
          id: input.electionId,
        },
      });

      if (!election)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election not found",
        });

      if (isElectionOngoing({ election, withTime: true }))
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Election is ongoing",
        });

      if (election.end_date < new Date())
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Election is already finished",
        });

      const hasVoter = await ctx.prisma.voter.findFirst({
        where: {
          electionId: input.electionId,
        },
      });
      const hasInvitedVoter = await ctx.prisma.invitedVoter.findFirst({
        where: {
          electionId: input.electionId,
        },
      });

      if (hasVoter || hasInvitedVoter)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Election already has voters",
        });

      if (election.publicity === "PRIVATE")
        await ctx.prisma.election.update({
          where: {
            id: election.id,
          },
          data: {
            publicity: "VOTER",
          },
        });

      for (const field of input.field) {
        await ctx.prisma.voterField.upsert({
          where: {
            id: field.id,
          },
          update: {
            name: field.name,
          },
          create: {
            name: field.name,
            electionId: input.electionId,
          },
        });
      }
    }),
  getAllGeneratedResults: protectedProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.generatedElectionResult.findMany({
        where: {
          election: {
            slug: input.slug,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  generateResult: publicProcedure.mutation(async ({ ctx }) => {
    const elections = await ctx.prisma.election.findMany({
      where: {
        end_date: {
          lte: new Date(),
        },
      },
      include: {
        positions: {
          include: {
            candidate: {
              include: {
                vote: true,
                partylist: true,
              },
            },
            vote: true,
          },
        },
      },
    });

    for (const election of elections) {
      const result = {
        id: election.id,
        name: election.name,
        slug: election.slug,
        start_date: election.start_date,
        end_date: election.end_date,
        logo: election.logo || null,
        voting_start: election.voting_start,
        voting_end: election.voting_end,
        positions: election.positions.map((position) => ({
          id: position.id,
          name: position.name,
          votes: position.vote.length,
          candidates: position.candidate.map((candidate) => ({
            id: candidate.id,
            name: `${candidate.last_name}, ${candidate.first_name}${
              candidate.middle_name
                ? " " + candidate.middle_name.charAt(0) + "."
                : ""
            } (${candidate.partylist.acronym})`,
            votes: candidate.vote.length,
          })),
        })),
      };

      const name = `${Date.now().toString()} - ${
        election.name
      } (Result) (${new Date().toDateString()}).pdf`;
      const path = `elections/${election.id}/results/${name}`;

      await supabase.storage
        .from("eboto-mo")
        .upload(
          path,
          await ReactPDF.pdf(<GenerateResult result={result} />).toBlob()
        );

      const {
        data: { publicUrl },
      } = supabase.storage.from("eboto-mo").getPublicUrl(path);

      await ctx.prisma.generatedElectionResult.create({
        data: {
          name: `${Date.now().toString()} - ${
            election.name
          } (Result) (${new Date().toDateString()})`,
          link: publicUrl,
          electionId: election.id,
        },
      });
    }
  }),
  vote: protectedProcedure
    .input(
      z.object({
        electionId: z.string(),
        votes: z.array(
          z.object({
            positionId: z.string(),
            votes: z.array(z.string()),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUniqueOrThrow({
        where: {
          id: input.electionId,
        },
      });
      if (!isElectionOngoing({ election, withTime: true }))
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Election is not ongoing",
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
      await ctx.prisma.vote.createMany({
        data: input.votes
          .map((vote) =>
            vote.votes.map((candidateId) =>
              candidateId === "abstain"
                ? {
                    positionId: vote.positionId,
                    voterId: ctx.session.user.id,
                    electionId: input.electionId,
                  }
                : {
                    candidateId,
                    voterId: ctx.session.user.id,
                    electionId: input.electionId,
                  }
            )
          )
          .flat(),
      });

      const positions = await ctx.prisma.position.findMany({
        where: {
          electionId: election.id,
        },
      });

      const candidates = await ctx.prisma.candidate.findMany({
        where: {
          electionId: election.id,
        },
      });

      const votes = positions.map((position) => {
        return {
          position,
          votes: candidates.filter((candidate) =>
            input.votes
              .find((vote) => vote.positionId === position.id)
              ?.votes.includes(candidate.id)
          ),
        };
      });

      await sendEmailTransport({
        email: ctx.session.user.email,
        subject: `Resibo: You have successfully casted your vote in ${election.name}`,
        html: render(<VoteCasted election={election} votes={votes} />),
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
      const realtimeResult = await ctx.prisma.position.findMany({
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
            orderBy: {
              vote: {
                _count: "desc",
              },
            },
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

      // make the candidate as "Candidate 1"... "Candidate N" if the election is ongoing

      const election = await ctx.prisma.election.findUniqueOrThrow({
        where: {
          id: input,
        },
      });

      return realtimeResult.map((position) => {
        return {
          ...position,
          candidate: position.candidate
            .sort((a, b) => b.vote.length - a.vote.length)
            .map((candidate, index) => {
              return {
                id: candidate.id,
                first_name: isElectionOngoing({ election, withTime: true })
                  ? `Candidate ${index + 1}`
                  : candidate.first_name,
                last_name: isElectionOngoing({ election, withTime: true })
                  ? ""
                  : candidate.last_name,
                middle_name: isElectionOngoing({ election, withTime: true })
                  ? ""
                  : candidate.middle_name,
                partylist: candidate.partylist,
                vote: candidate.vote,
              };
            }),
        };
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
          voterField: true,
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
          user: {
            include: {
              votes: {
                where: {
                  electionId: election.id,
                },
              },
            },
          },
        },
      });

      return {
        voters: z
          .array(
            z.object({
              id: z.string(),
              email: z.string(),
              accountStatus: z.enum([
                "ACCEPTED",
                "INVITED",
                "DECLINED",
                "ADDED",
              ]),
              hasVoted: z.boolean(),
              createdAt: z.date(),
              field: z.record(z.string(), z.string()).nullable(),
            })
          )
          .parse(
            voters
              .map((voter) => ({
                id: voter.id,
                email: voter.user.email,
                accountStatus: "ACCEPTED",
                createdAt: voter.createdAt,
                hasVoted: voter.user.votes.length > 0,
                field: voter.field,
              }))
              .concat(
                invitedVoter.map((voter) => ({
                  id: voter.id,
                  email: voter.email,
                  accountStatus: voter.status,
                  createdAt: voter.createdAt,
                  hasVoted: false,
                  field: voter.field,
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
    const elections = await ctx.prisma.election.findMany({
      where: {
        // voter_domain: ctx.session.user.email.split("@")[1],
        publicity: {
          not: "PRIVATE",
        },
        // voters: {
        //   some: {
        //     userId: ctx.session.user.id,
        //   },
        // },
      },
      include: {
        voters: true,
        vote: {
          where: {
            voterId: ctx.session.user.id,
          },
        },
      },
    });

    return elections.filter(
      (election) =>
        election.voters.some((voter) => voter.userId === ctx.session.user.id) ||
        election.voter_domain === ctx.session.user.email.split("@")[1]
    );
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
        description: z.string().nullable(),
        voter_domain: z.string().nullable(),
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

      if (
        input.voter_domain &&
        input.voter_domain.trim().toLowerCase() === "gmail.com"
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Gmail is not allowed as voter domain",
        });

      if (
        isElectionOngoing({ election, withTime: false }) &&
        input.voter_domain !== election.voter_domain
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Voter domain cannot be changed while election is ongoing",
        });

      return await ctx.prisma.election.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          slug: input.slug.trim().toLowerCase(),
          description: input.description,
          voter_domain: input.voter_domain,
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
