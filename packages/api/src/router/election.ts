import { TRPCError } from "@trpc/server";
// TODO: Remove import { File } from "@web-std/file"; when Vercel supports Node.js 20
import { File } from "@web-std/file";
import { nanoid } from "nanoid";
import { z } from "zod";

import {
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
        election_slug: z.string().nonempty(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const election = await ctx.db.query.elections.findFirst({
        where: (election, { eq, and, isNull }) =>
          and(
            eq(election.slug, input.election_slug),
            isNull(election.deleted_at),
          ),
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

      const isImVoter = await ctx.db.query.voters.findFirst({
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
            eq(votes.voter_id, ctx.session?.user.id ?? ""),
            eq(votes.election_id, election.id),
          ),
      });

      return {
        election,
        positions,
        isOngoing,
        isImVoter: !!isImVoter,
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
            votes: z.array(z.string()),
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

        await db.insert(votes).values(
          input.votes
            .map((vote) =>
              vote.votes.map((candidate_id) =>
                candidate_id === "abstain"
                  ? {
                      position_id: vote.position_id,
                      voter_id: ctx.session.user.id,
                      election_id: input.election_id,
                    }
                  : {
                      candidate_id,
                      voter_id: ctx.session.user.id,
                      election_id: input.election_id,
                    },
              ),
            )
            .flat(),
        );

        if (ctx.session.user.email) {
          const positions = await db.query.positions.findMany({
            where: (positions, { eq, and }) =>
              and(eq(positions.election_id, input.election_id)),
            orderBy: (positions, { asc }) => asc(positions.order),
          });

          const votesCasted = await db.query.votes.findMany({
            where: (votes, { eq, and }) =>
              and(
                eq(votes.voter_id, ctx.session.user.id),
                eq(votes.election_id, input.election_id),
              ),
            with: {
              candidate: true,
              position: true,
            },
          });

          const votesCastedByPosition = {
            ...election,
            positions: positions.map((position) => ({
              ...position,
              votes: votesCasted.filter(
                (vote) => vote.position_id === position.id,
              ),
            })),
          };

          await sendVoteCasted({
            email: ctx.session.user.email,
            election: votesCastedByPosition,
          });
        }
      });
    }),
  getElectionBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string().nonempty(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const election = await ctx.db.query.elections.findFirst({
        where: (elections, { eq }) => eq(elections.slug, input.slug),
      });

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      return election;
    }),
  getDashboardOverviewData: protectedProcedure
    .input(
      z.object({
        election_slug: z.string().nonempty(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const election = await ctx.db.query.elections.findFirst({
        where: (elections, { eq }) => eq(elections.slug, input.election_slug),
        with: {
          positions: true,
          partylists: {
            where: (partylist, { eq, not }) =>
              not(eq(partylist.acronym, "IND")),
          },
          voters: {
            with: {
              votes: true,
            },
          },
          generated_election_results: true,
          candidates: true,
        },
      });

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      return election;
    }),
  reportAProblem: protectedProcedure
    .input(
      z.object({
        subject: z.string().nonempty(),
        description: z.string().nonempty(),
        election_id: z.string().nonempty(),
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
              first_name: isElectionOngoing({ election })
                ? `Candidate ${index + 1}`
                : candidate.first_name,
              last_name: isElectionOngoing({ election })
                ? ""
                : candidate.last_name,
              middle_name: isElectionOngoing({ election })
                ? ""
                : candidate.middle_name,
              partylist: candidate.partylist,
              vote: candidate.votes.length,
            };
          }),
      }));
    }),
  // getElectionBySlug: publicProcedure
  //   .input(
  //     z.object({
  //       slug: z.string().nonempty(),
  //     }),
  //   )
  //   .query(async ({ input }) => {
  //     return await ctx.db.query.elections.findFirst({
  //       where: (elections, { eq }) => eq(elections.slug, input.slug),
  //     });
  //   }),
  getAllMyElections: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Validate commissioner
    return await ctx.db.query.commissioners.findMany({
      where: (commissioners, { eq }) =>
        eq(commissioners.user_id, ctx.session.user.id),
      with: {
        election: true,
      },
    });
  }),
  // getDashboardPartylistData: protectedProcedure
  //   .input(
  //     z.object({
  //       election_id: z.string().nonempty(),
  //     }),
  //   )
  //   .query(async ({ ctx, input }) => {
  //     // TODO: Validate commissioner
  //     return await ctx.db.query.partylists.findMany({
  //       where: (partylists, { eq, and }) =>
  //         and(
  //           eq(partylists.election_id, input.election_id),
  //           not(eq(partylists.acronym, "IND")),
  //         ),
  //       orderBy: (partylists, { desc }) => desc(partylists.updated_at),
  //     });
  //   }),
  // getAllPartylistsByElectionId: protectedProcedure
  //   .input(
  //     z.object({
  //       election_id: z.string().nonempty(),
  //     }),
  //   )
  //   .query(async ({ ctx, input }) => {
  //     // TODO: Validate commissioner
  //     return await ctx.db.query.partylists.findMany({
  //       where: (partylists, { eq }) =>
  //         eq(partylists.election_id, input.election_id),
  //       orderBy: (partylists, { asc }) => asc(partylists.created_at),
  //     });
  //   }),
  // getDashboardData: protectedProcedure
  //   .input(
  //     z.object({
  //       election_id: z.string().nonempty(),
  //     }),
  //   )
  //   .query(async ({ ctx, input }) => {
  //     // TODO: Validate commissioner
  //     return await ctx.db.query.positions.findMany({
  //       where: (positions, { eq }) =>
  //         eq(positions.election_id, input.election_id),
  //       orderBy: (positions, { asc }) => asc(positions.order),
  //     });
  //   }),
  // getAllCandidatesByElectionId: protectedProcedure
  //   .input(
  //     z.object({
  //       election_id: z.string().nonempty(),
  //     }),
  //   )
  //   .query(async ({ ctx, input }) => {
  //     // TODO: Validate commissioner
  //     return await ctx.db.query.positions.findMany({
  //       where: (positions, { eq }) =>
  //         eq(positions.election_id, input.election_id),
  //       orderBy: (positions, { asc }) => asc(positions.order),
  //       with: {
  //         candidates: {
  //           with: {
  //             partylist: true,
  //             credential: {
  //               columns: {
  //                 id: true,
  //               },
  //               with: {
  //                 affiliations: {
  //                   columns: {
  //                     id: true,
  //                     org_name: true,
  //                     org_position: true,
  //                     start_year: true,
  //                     end_year: true,
  //                   },
  //                 },
  //                 achievements: {
  //                   columns: {
  //                     id: true,
  //                     name: true,
  //                     year: true,
  //                   },
  //                 },
  //                 events_attended: {
  //                   columns: {
  //                     id: true,
  //                     name: true,
  //                     year: true,
  //                   },
  //                 },
  //               },
  //             },
  //             platforms: {
  //               columns: {
  //                 id: true,
  //                 title: true,
  //                 description: true,
  //               },
  //             },
  //           },
  //         },
  //       },
  //     });
  //   }),
  getVotersByElectionId: protectedProcedure
    .input(
      z.object({
        election_id: z.string().nonempty(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const voters = await ctx.db.query.voters.findMany({
        where: (voters, { eq }) => eq(voters.election_id, input.election_id),

        with: {
          votes: {
            limit: 1,
          },
        },
      });

      return voters.map((voter) => ({
        id: voter.id,
        email: voter.email,
        created_at: voter.created_at,
        has_voted: !!voter.votes.length,
      }));
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().nonempty(),
        slug: z.string().nonempty().trim().toLowerCase(),
        start_date: z.date(),
        end_date: z.date(),
        template: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Validate commissioner
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
          start_date: input.start_date,
          end_date: input.end_date,
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
        id: z.string().nonempty(),
        name: z.string().nonempty(),
        description: z.string().nullable(),
        oldSlug: z.string().trim().toLowerCase(),
        newSlug: z.string().nonempty().trim().toLowerCase(),
        start_date: z.date(),
        end_date: z.date(),
        publicity: z.enum(publicity),
        logo: z
          .object({
            name: z.string().nonempty(),
            type: z.string().nonempty(),
            base64: z.string().nonempty(),
          })
          .nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Validate commissioner
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
            start_date: input.start_date,
            end_date: input.end_date,
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
        election_id: z.string().nonempty(),
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
});
