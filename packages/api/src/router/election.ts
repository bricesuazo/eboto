import { TRPCError } from "@trpc/server";
// TODO: Remove import { File } from "@web-std/file"; when Vercel supports Node.js 20
import { File } from "@web-std/file";
import { nanoid } from "nanoid";
import { z } from "zod";

import {
  isElectionEnded,
  isElectionOngoing,
  positionTemplate,
  takenSlugs,
} from "@eboto-mo/constants";
import { eq } from "@eboto-mo/db";
import {
  commissioners,
  elections,
  partylists,
  positions,
  publicity,
  reported_problems,
  votes,
} from "@eboto-mo/db/schema";
import { sendVoteCasted } from "@eboto-mo/email/emails/vote-casted";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const electionRouter = createTRPCRouter({
  getElectionPage: publicProcedure
    .input(
      z.object({
        election_slug: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const election = await ctx.db.query.elections.findFirst({
        where: (election, { eq, and, isNull }) =>
          and(
            eq(election.slug, input.election_slug),
            isNull(election.deleted_at),
          ),
        with: {
          voter_fields: true,
        },
      });

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      const isOngoing = isElectionOngoing({ election });

      const positions = await ctx.db.query.positions.findMany({
        where: (position, { eq, and, isNull }) =>
          and(
            eq(position.election_id, election.id),
            isNull(position.deleted_at),
          ),
        with: {
          candidates: {
            where: (candidate, { eq, and, isNull }) =>
              and(
                eq(candidate.election_id, election.id),
                isNull(candidate.deleted_at),
              ),
            with: {
              partylist: true,
            },
          },
        },
        orderBy: (positions, { asc }) => [asc(positions.order)],
      });

      const myVoterData = await ctx.db.query.voters.findFirst({
        where: (voter, { eq, and, isNull }) =>
          and(
            eq(voter.election_id, election.id),
            eq(voter.email, ctx.session?.user.email ?? ""),
            isNull(voter.deleted_at),
          ),
      });

      const hasVoted = await ctx.db.query.votes.findFirst({
        where: (votes, { eq, and }) =>
          and(
            eq(votes.voter_id, myVoterData?.id ?? ""),
            eq(votes.election_id, election.id),
          ),
      });

      return {
        election,
        positions,
        isOngoing,
        myVoterData,
        hasVoted: !!hasVoted,
      };
    }),
  vote: protectedProcedure
    .input(
      z.object({
        election_id: z.string(),
        votes: z.array(
          z.object({
            position_id: z.string(),
            votes: z
              .object({
                isAbstain: z.literal(true),
              })
              .or(
                z.object({
                  isAbstain: z.literal(false),
                  candidates: z.array(z.string()),
                }),
              ),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.transaction(async (db) => {
        const election = await db.query.elections.findFirst({
          where: (elections, { eq }) => eq(elections.id, input.election_id),
        });

        if (!election) throw new TRPCError({ code: "NOT_FOUND" });

        if (!isElectionOngoing({ election }))
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Election is not ongoing",
          });

        const existingVotes = await db.query.votes.findFirst({
          where: (votes, { eq, and }) =>
            and(
              eq(votes.voter_id, ctx.session.user.id),
              eq(votes.election_id, election.id),
            ),
        });

        if (existingVotes)
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You have already voted in this election",
          });

        const isVoterExists = await db.query.voters.findFirst({
          where: (voters, { eq, and }) =>
            and(
              eq(voters.election_id, election.id),
              eq(voters.email, ctx.session.user.email ?? ""),
            ),
        });

        if (!isVoterExists)
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You are not a voter in this election",
          });

        await db.insert(votes).values(
          input.votes
            .map((vote) =>
              vote.votes.isAbstain
                ? {
                    position_id: vote.position_id,
                    voter_id: isVoterExists.id,
                    election_id: input.election_id,
                  }
                : vote.votes.candidates.map((candidate_id) => ({
                    candidate_id,
                    voter_id: isVoterExists.id,
                    election_id: input.election_id,
                  })),
            )
            .flat(),
        );

        if (ctx.session.user.email) {
          const positions = await db.query.positions.findMany({
            where: (positions, { eq, and }) =>
              and(eq(positions.election_id, input.election_id)),
            orderBy: (positions, { asc }) => asc(positions.order),
          });

          const candidates = await db.query.candidates.findMany({
            where: (candidates, { eq, and }) =>
              and(eq(candidates.election_id, input.election_id)),
          });

          await sendVoteCasted({
            email: ctx.session.user.email,
            election: {
              name: election.name,
              slug: election.slug,

              positions: input.votes.map((vote) => ({
                id: vote.position_id,
                name:
                  positions.find((position) => position.id === vote.position_id)
                    ?.name ?? "",
                vote: !vote.votes.isAbstain
                  ? {
                      isAbstain: false,
                      candidates: vote.votes.candidates.map((candidate_id) => {
                        const candidate = candidates.find(
                          (candidate) => candidate.id === candidate_id,
                        );

                        return {
                          id: candidate?.id ?? "",
                          name: `${candidate?.first_name} ${
                            candidate?.middle_name
                              ? candidate?.middle_name + " "
                              : ""
                          }${candidate?.last_name}`,
                        };
                      }),
                    }
                  : { isAbstain: true },
              })),
            },
          });
        }
      });
    }),
  getElectionBySlug: publicProcedure
    .input(
      z.object({
        election_slug: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const election = await ctx.db.query.elections.findFirst({
        where: (elections, { eq, and, isNull }) =>
          and(
            eq(elections.slug, input.election_slug),
            isNull(elections.deleted_at),
          ),
      });

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      return election;
    }),
  getDashboardOverviewData: protectedProcedure
    .input(
      z.object({
        election_slug: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const election = await ctx.db.query.elections.findFirst({
        where: (elections, { eq, and, isNull }) =>
          and(
            eq(elections.slug, input.election_slug),
            isNull(elections.deleted_at),
          ),
        with: {
          positions: true,
          partylists: {
            where: (partylist, { and, isNull, ne }) =>
              and(ne(partylist.acronym, "IND"), isNull(partylist.deleted_at)),
          },
          voters: {
            where: (voters, { isNull }) => isNull(voters.deleted_at),
            with: {
              votes: true,
            },
          },
          generated_election_results: true,
          candidates: {
            where: (candidates, { isNull }) => isNull(candidates.deleted_at),
          },
        },
      });

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      return election;
    }),
  reportAProblem: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(1),
        description: z.string().min(1),
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.insert(reported_problems).values({
        subject: input.subject,
        description: input.description,
        election_id: input.election_id,
        user_id: ctx.session.user.id,
      });
    }),
  getElectionVoting: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      return ctx.db.query.positions.findMany({
        where: (position, { eq, and, isNull }) =>
          and(eq(position.election_id, input), isNull(position.deleted_at)),
        orderBy: (position, { asc }) => asc(position.order),
        with: {
          candidates: {
            where: (candidate, { eq, and, isNull }) =>
              and(
                eq(candidate.election_id, input),
                isNull(candidate.deleted_at),
              ),
            with: {
              partylist: true,
            },
          },
        },
      });
    }),
  getElectionRealtime: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const election = await ctx.db.query.elections.findFirst({
        where: (election, { eq, and, isNull }) =>
          and(eq(election.slug, input), isNull(election.deleted_at)),
      });

      if (!election) throw new Error("Election not found");

      const realtimeResult = await ctx.db.query.positions.findMany({
        where: (position, { eq, and, isNull }) =>
          and(
            eq(position.election_id, election.id),
            isNull(position.deleted_at),
          ),
        orderBy: (position, { asc }) => asc(position.order),
        with: {
          votes: true,
          candidates: {
            where: (candidate, { eq, and, isNull }) =>
              and(
                eq(candidate.election_id, election.id),
                isNull(candidate.deleted_at),
              ),
            with: {
              votes: {
                with: {
                  candidate: true,
                },
              },
              partylist: {
                columns: {
                  acronym: true,
                },
              },
            },
          },
        },
      });

      // make the candidate as "Candidate 1"... "Candidate N" if the election is ongoing

      return realtimeResult.map((position) => ({
        ...position,
        votes: position.votes.length,
        candidates: position.candidates
          .sort((a, b) => b.votes.length - a.votes.length)
          .map((candidate, index) => {
            return {
              id: candidate.id,
              name: isElectionOngoing({ election })
                ? `Candidate ${index + 1}`
                : `${candidate.last_name}, ${candidate.first_name}${
                    candidate.middle_name ? " " + candidate.middle_name : ""
                  } (${candidate.partylist.acronym})`,
              vote: candidate.votes.length,
            };
          }),
      }));
    }),
  getAllMyElections: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.commissioners.findMany({
      where: (commissioners, { eq, isNull, and }) =>
        and(
          isNull(commissioners.deleted_at),
          eq(commissioners.user_id, ctx.session.user.id),
        ),
      with: {
        election: true,
      },
    });
  }),
  getVotersByElectionSlug: protectedProcedure
    .input(
      z.object({
        election_slug: z.string().min(1),
      }),
    )
    .query(async ({ input, ctx }) => {
      const election = await ctx.db.query.elections.findFirst({
        where: (election, { eq, and, isNull }) =>
          and(
            eq(election.slug, input.election_slug),
            isNull(election.deleted_at),
          ),
        with: {
          voter_fields: true,
        },
      });

      if (!election)
        throw new TRPCError({
          code: "NOT_FOUND",
        });

      const votersFromDb = await ctx.db.query.voters.findMany({
        where: (voters, { eq, and, isNull }) =>
          and(eq(voters.election_id, election.id), isNull(voters.deleted_at)),

        with: {
          votes: {
            limit: 1,
          },
        },
      });

      return {
        election,
        voters: votersFromDb.map((voter) => ({
          id: voter.id,
          email: voter.email,
          created_at: voter.created_at,
          field: voter.field,
          has_voted: !!voter.votes.length,
        })),
      };
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1).trim().toLowerCase(),
        start_date: z.date(),
        end_date: z.date(),
        template: z.string(),
        voting_hours: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (takenSlugs.includes(input.slug)) {
        throw new Error("Election slug is already exists");
      }

      const isElectionSlugExists = await ctx.db.query.elections.findFirst({
        where: (elections, { eq, and, isNull }) =>
          and(eq(elections.slug, input.slug), isNull(elections.deleted_at)),
      });

      if (isElectionSlugExists) {
        throw new Error("Election slug is already exists");
      }

      const id = nanoid();

      await ctx.db.transaction(async (db) => {
        await db.insert(elections).values({
          id,
          name: input.name,
          slug: input.slug,
          start_date: new Date(input.start_date.toISOString()),
          end_date: new Date(input.end_date.toISOString()),
          voting_hour_start: input.voting_hours[0],
          voting_hour_end: input.voting_hours[1],
        });
        await db.insert(commissioners).values({
          election_id: id,
          user_id: ctx.session.user.id,
        });
        await db.insert(partylists).values({
          name: "Independent",
          acronym: "IND",
          election_id: id,
        });

        const positionsInTemplate =
          positionTemplate
            .find((template) =>
              template.organizations.find(
                (organization) => organization.id === input.template,
              ),
            )
            ?.organizations.find(
              (organization) => organization.id === input.template,
            )
            ?.positions.map((position, i) => ({
              name: position,
              order: i,
              election_id: id,
            })) ?? [];
        if (input.template !== "none" && positionsInTemplate.length > 0)
          await db.insert(positions).values(positionsInTemplate);
      });
    }),
  edit: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().nullable(),
        oldSlug: z.string().trim().toLowerCase(),
        newSlug: z.string().min(1).trim().toLowerCase(),
        start_date: z.date(),
        end_date: z.date(),
        publicity: z.enum(publicity),
        // voter_domain: z.string().nullable(),
        voting_hours: z.array(z.number()),
        logo: z
          .object({
            name: z.string().min(1),
            type: z.string().min(1),
            base64: z.string().min(1),
          })
          .nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.newSlug !== input.oldSlug) {
        if (takenSlugs.includes(input.newSlug)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Election slug is already exists",
          });
        }

        const isElectionSlugExists = await ctx.db.query.elections.findFirst({
          where: (elections, { eq }) => eq(elections.slug, input.newSlug),
        });

        if (isElectionSlugExists)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Election slug is already exists",
          });
      }

      await ctx.db.transaction(async (db) => {
        const isElectionCommissionerExists = await db.query.elections.findFirst(
          {
            with: {
              commissioners: {
                where: (commissioners, { eq }) =>
                  eq(commissioners.user_id, ctx.session.user.id),
              },
            },
          },
        );

        if (!isElectionCommissionerExists)
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Unauthorized",
          });

        if (!isElectionCommissionerExists.commissioners.length)
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Unauthorized",
          });

        if (
          isElectionCommissionerExists.logo &&
          (input.logo === null || !!input.logo)
        ) {
          await ctx.utapi.deleteFiles(isElectionCommissionerExists.logo.key);
        }

        await db
          .update(elections)
          .set({
            name: input.name,
            slug: input.newSlug,
            description: input.description,
            publicity: input.publicity,
            start_date: new Date(input.start_date.toISOString()),
            end_date: new Date(input.end_date.toISOString()),
            // voter_domain: input.voter_domain,
            voting_hour_start: input.voting_hours[0],
            voting_hour_end: input.voting_hours[1],
            logo: input.logo
              ? await fetch(input.logo.base64)
                  .then((res) => res.blob())
                  .then(
                    async (blob) =>
                      (
                        await ctx.utapi.uploadFiles(
                          new File(
                            [blob],
                            `election_logo_${input.id}_${input.logo!.name}`,
                            {
                              type: input.logo!.type,
                            },
                          ),
                        )
                      ).data,
                  )
              : input.logo,
          })
          .where(eq(elections.id, input.id));
      });
    }),
  delete: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (db) => {
        await db
          .update(commissioners)
          .set({
            deleted_at: new Date(),
          })
          .where(eq(commissioners.election_id, input.election_id));
        await db
          .update(elections)
          .set({
            deleted_at: new Date(),
          })
          .where(eq(elections.id, input.election_id));
      });
    }),
  getVoterFieldsStats: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const election = await ctx.db.query.elections.findFirst({
        where: (elections, { eq }) => eq(elections.id, input.election_id),
        with: {
          voter_fields: true,
        },
      });

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      const voters = await ctx.db.query.voters.findMany({
        where: (voters, { eq }) => eq(voters.election_id, input.election_id),
        with: {
          votes: true,
        },
      });

      const fields = [];

      for (const field of election.voter_fields) {
        const fieldOptions = [] as {
          name: string;
          vote_count: number;
        }[];

        for (const voter of voters) {
          const optionName = voter.field?.[field.id] ?? "";
          const voteCount = voter.votes.length > 0 ? 1 : 0;

          const existingOption = fieldOptions.find(
            (option) => option.name === optionName,
          );

          if (existingOption) {
            existingOption.vote_count += voteCount;
          } else {
            fieldOptions.push({
              name: optionName,
              vote_count: voteCount,
            });
          }
        }

        fields.push({
          id: field.id,
          name: field.name,
          created_at: field.created_at,
          options: fieldOptions,
        });
      }
      return fields;
    }),
  getVoterFieldsStatsInRealtime: publicProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const election = await ctx.db.query.elections.findFirst({
        where: (elections, { eq }) => eq(elections.id, input.election_id),
        with: {
          voter_fields: true,
        },
      });

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      if (!isElectionOngoing({ election }))
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Election is not ongoing",
        });

      if (!ctx.session && election.publicity !== "PUBLIC")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Election is not public",
        });

      const voters = await ctx.db.query.voters.findMany({
        where: (voters, { eq }) => eq(voters.election_id, input.election_id),
        with: {
          votes: true,
        },
      });

      const fields = [];

      for (const field of election.voter_fields) {
        const fieldOptions = [] as {
          name: string;
          vote_count: number;
        }[];

        for (const voter of voters) {
          const optionName = voter.field?.[field.id] ?? "";
          const voteCount = voter.votes.length > 0 ? 1 : 0;

          const existingOption = fieldOptions.find(
            (option) => option.name === optionName,
          );

          if (existingOption) {
            existingOption.vote_count += voteCount;
          } else {
            fieldOptions.push({
              name: optionName,
              vote_count: voteCount,
            });
          }
        }

        fields.push({
          id: field.id,
          name: field.name,
          created_at: field.created_at,
          options: fieldOptions,
        });
      }
      return fields;
    }),
  getElectionProgress: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const election = await ctx.db.query.elections.findFirst({
        where: (elections, { eq, and, isNull }) =>
          and(
            eq(elections.id, input.election_id),
            isNull(elections.deleted_at),
          ),
        with: {
          voters: {
            limit: 1,
            where: (voters, { isNull }) => isNull(voters.deleted_at),
          },
          partylists: {
            limit: 2,
            where: (partylists, { isNull }) => isNull(partylists.deleted_at),
          },
          positions: {
            limit: 1,
            where: (positions, { isNull }) => isNull(positions.deleted_at),
          },
          candidates: {
            limit: 1,
            where: (candidates, { isNull }) => isNull(candidates.deleted_at),
          },
        },
      });

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      if (isElectionEnded({ election })) return 7;

      if (isElectionOngoing({ election })) return 6;

      if (election.voters.length > 0) return 5;

      if (election.candidates.length > 0) return 4;

      if (election.positions.length > 0) return 3;

      if (election.partylists.length > 1) return 2;

      return 1;
    }),
});
