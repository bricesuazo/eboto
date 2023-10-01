import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import {
  isElectionOngoing,
  positionTemplate,
  takenSlugs,
} from "@eboto-mo/constants";
import {
  achievements,
  affiliations,
  candidates,
  commissioners,
  credentials,
  elections,
  events_attended,
  partylists,
  platforms,
  positions,
  publicity,
  reported_problems,
  voter_fields,
  voters,
} from "@eboto-mo/db/schema";

import { account_status_type_with_accepted } from "../../../../apps/www/src/utils/zod-schema";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const electionRouter = createTRPCRouter({
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
        where: (position, { eq, and }) =>
          and(eq(position.election_id, input), isNull(position.deleted_at)),
        orderBy: (position, { asc }) => asc(position.order),
        with: {
          candidates: {
            where: (candidate, { eq, and }) =>
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
        where: (election, { eq, and }) =>
          and(eq(election.slug, input), isNull(election.deleted_at)),
      });

      if (!election) throw new Error("Election not found");

      const realtimeResult = await ctx.db.query.positions.findMany({
        where: (position, { eq, and }) =>
          and(
            eq(position.election_id, election.id),
            isNull(position.deleted_at),
          ),
        orderBy: (position, { asc }) => asc(position.order),
        with: {
          votes: true,
          candidates: {
            where: (candidate, { eq, and }) =>
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
  //       slug: z.string().min(1),
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
  // getAllPartylistsWithoutINDByElectionId: protectedProcedure
  //   .input(
  //     z.object({
  //       election_id: z.string().min(1),
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
  //       election_id: z.string().min(1),
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
  // getAllPositionsByElectionId: protectedProcedure
  //   .input(
  //     z.object({
  //       election_id: z.string().min(1),
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
  //       election_id: z.string().min(1),
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
        election_id: z.string().min(1),
      }),
    )
    .query(async ({ input, ctx }) => {
      const voters = await ctx.db.query.voters.findMany({
        where: (voters, { eq }) => eq(voters.election_id, input.election_id),

        with: {
          user: true,
          votes: {
            limit: 1,
          },
        },
      });

      return voters.map((voter) => ({
        id: voter.id,
        email: voter.user.email,
        account_status: "ACCEPTED",
        created_at: voter.created_at,
        has_voted: voter.votes.length > 0,
      }));
    }),
  createElection: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1).trim().toLowerCase(),
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
        where: (elections, { eq }) => eq(elections.slug, input.slug),
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
  editElection: protectedProcedure
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
        logo: z.string().nullable(),
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

      const isElectionCommissionerExists =
        await ctx.db.query.elections.findFirst({
          with: {
            commissioners: {
              where: (commissioners, { eq }) =>
                eq(commissioners.user_id, ctx.session.user.id),
            },
          },
        });

      if (!isElectionCommissionerExists)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });

      await ctx.db
        .update(elections)
        .set({
          name: input.name,
          slug: input.newSlug,
          description: input.description,
          publicity: input.publicity,
          start_date: input.start_date,
          end_date: input.end_date,
          logo: input.logo,
        })
        .where(eq(elections.id, input.id));
    }),
  createPartylist: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        acronym: z.string().min(1),
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Validate commissioner
      const isAcronymExists = await ctx.db.query.partylists.findFirst({
        where: (partylist, { eq, and }) =>
          and(
            eq(partylist.election_id, input.election_id),
            eq(partylist.acronym, input.acronym),
          ),
      });

      if (isAcronymExists) throw new Error("Acronym is already exists");

      await ctx.db.insert(partylists).values({
        name: input.name,
        acronym: input.acronym,
        election_id: input.election_id,
      });
    }),
  editPartylist: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        oldAcronym: z.string().optional(),
        newAcronym: z.string().min(1),
        election_id: z.string().min(1),
        description: z.string().nullable(),
        logo_link: z.string().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Validate commissioner
      if (input.newAcronym === "IND")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "IND is a reserved acronym",
        });

      if (input.oldAcronym !== input.newAcronym) {
        const isAcronymExists = await ctx.db.query.partylists.findFirst({
          where: (partylist, { eq, and }) =>
            and(
              eq(partylist.election_id, input.election_id),
              eq(partylist.acronym, input.newAcronym),
            ),
        });

        if (isAcronymExists)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Acronym is already exists",
          });
      }

      await ctx.db
        .update(partylists)
        .set({
          name: input.name,
          acronym: input.newAcronym,
          description: input.description,
          logo_link: input.logo_link,
        })
        .where(eq(partylists.id, input.id));
    }),
  deletePartylist: protectedProcedure
    .input(
      z.object({
        partylist_id: z.string().min(1),
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Validate commissioner
      await ctx.db
        .update(partylists)
        .set({
          deleted_at: new Date(),
        })
        .where(
          and(
            eq(partylists.id, input.partylist_id),
            eq(partylists.election_id, input.election_id),
          ),
        );
    }),
  deleteCandidate: protectedProcedure
    .input(
      z.object({
        candidate_id: z.string().min(1),
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Validate commissioner

      await ctx.db
        .delete(candidates)
        .where(
          and(
            eq(candidates.id, input.candidate_id),
            eq(candidates.election_id, input.election_id),
          ),
        );
    }),
  createPosition: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        min: z.number().nonnegative().optional(),
        max: z.number().nonnegative().optional(),
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Validate commissioner

      const positionsInDB = await ctx.db.query.positions.findMany({
        where: (positions, { eq }) =>
          eq(positions.election_id, input.election_id),
        columns: {
          id: true,
        },
      });

      await ctx.db.insert(positions).values({
        name: input.name,
        order: positionsInDB.length,
        min: input.min,
        max: input.max,
        election_id: input.election_id,
      });
    }),
  deletePosition: protectedProcedure
    .input(
      z.object({
        position_id: z.string().min(1),
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Validate commissioner
      await ctx.db
        .update(positions)
        .set({
          deleted_at: new Date(),
        })
        .where(
          and(
            eq(positions.id, input.position_id),
            eq(positions.election_id, input.election_id),
          ),
        );
    }),
  editPosition: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        min: z.number().nonnegative().optional(),
        max: z.number().nonnegative().optional(),
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const positionsInDB = await ctx.db.query.positions.findMany({
        where: (position, { eq }) =>
          eq(position.election_id, input.election_id),
        columns: {
          id: true,
        },
      });

      await ctx.db
        .update(positions)
        .set({
          name: input.name,
          description: input.description,
          order: positionsInDB.length,
          min: input.min,
          max: input.max,
        })
        .where(
          and(
            eq(positions.id, input.id),
            eq(positions.election_id, input.election_id),
          ),
        );
    }),
  uploadImage: protectedProcedure
    .input(z.object({ candidate_id: z.string(), file: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const candidate = await ctx.db.query.candidates.findFirst({
        where: (candidate, { eq }) => eq(candidate.id, input.candidate_id),
        with: {
          election: {
            with: {
              commissioners: true,
            },
          },
        },
      });

      if (
        !candidate?.election.commissioners.some(
          (commissioner) => commissioner.user_id === ctx.session.user.id,
        )
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });

      return ctx.db
        .update(candidates)
        .set({
          image_link: input.file,
        })
        .where(eq(candidates.id, input.candidate_id));
    }),
  createSingleCandidate: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(1).trim().toLowerCase(),
        first_name: z.string().min(1),
        middle_name: z.string().nullable(),
        last_name: z.string().min(1),
        election_id: z.string().min(1),
        position_id: z.string().min(1),
        partylist_id: z.string().min(1),

        platforms: z.array(
          z.object({
            title: z.string().min(1),
            description: z.string().min(1),
          }),
        ),

        achievements: z.array(
          z.object({
            name: z.string().min(1),
            year: z.date(),
          }),
        ),
        affiliations: z.array(
          z.object({
            org_name: z.string().min(1),
            org_position: z.string().min(1),
            start_year: z.date(),
            end_year: z.date(),
          }),
        ),
        eventsAttended: z.array(
          z.object({
            name: z.string().min(1),
            year: z.date(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Validate commissioner
      const isCandidateSlugExists = await ctx.db.query.candidates.findFirst({
        where: (candidate, { eq, and }) =>
          and(
            eq(candidate.slug, input.slug),
            eq(candidate.election_id, input.election_id),
          ),
      });

      if (isCandidateSlugExists)
        throw new Error("Candidate slug is already exists");

      const candidateId = nanoid();
      const credentialId = nanoid();
      await ctx.db.transaction(async (db) => {
        await db.insert(candidates).values({
          id: candidateId,
          slug: input.slug,
          first_name: input.first_name,
          middle_name: input.middle_name,
          last_name: input.last_name,
          election_id: input.election_id,
          position_id: input.position_id,
          partylist_id: input.partylist_id,
          credential_id: credentialId,
        });

        await db.insert(credentials).values({
          id: credentialId,
          candidate_id: candidateId,
        });

        if (input.platforms.length > 0)
          await db.insert(platforms).values(
            input.platforms.map((platform) => ({
              title: platform.title,
              description: platform.description,
              candidate_id: candidateId,
            })),
          );

        if (input.affiliations.length > 0)
          await db.insert(affiliations).values(
            input.affiliations.map((affiliation) => ({
              org_name: affiliation.org_name,
              org_position: affiliation.org_position,
              start_year: affiliation.start_year,
              end_year: affiliation.end_year,
              credential_id: credentialId,
            })),
          );

        if (input.achievements.length > 0)
          await db.insert(achievements).values(
            input.achievements.map((achievement) => ({
              name: achievement.name,
              year: achievement.year,
              credential_id: credentialId,
            })),
          );

        if (input.eventsAttended.length > 0)
          await db.insert(events_attended).values(
            input.eventsAttended.map((event) => ({
              name: event.name,
              year: event.year,
              credential_id: credentialId,
            })),
          );
      });
      return {
        candidate_id: candidateId,
      };
    }),
  deleteSingleCredential: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        type: z.enum(["ACHIEVEMENT", "AFFILIATION", "EVENTATTENDED"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.type === "ACHIEVEMENT") {
        return ctx.db.delete(achievements).where(eq(achievements.id, input.id));
      } else if (input.type === "AFFILIATION") {
        return ctx.db.delete(affiliations).where(eq(affiliations.id, input.id));
      } else if (input.type === "EVENTATTENDED") {
        return ctx.db
          .delete(events_attended)
          .where(eq(events_attended.id, input.id));
      }
    }),
  deleteSinglePlatform: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.db.delete(platforms).where(eq(platforms.id, input.id));
    }),
  editCandidate: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        old_slug: z.string().min(1).trim(),
        new_slug: z.string().min(1).trim(),
        first_name: z.string().min(1),
        middle_name: z.string().nullable(),
        last_name: z.string().min(1),
        election_id: z.string().min(1),
        position_id: z.string().min(1),
        partylist_id: z.string().min(1),
        image_link: z.string().nullable(),

        credential_id: z.string().min(1),

        platforms: z.array(
          z.object({
            id: z.string(),
            title: z.string().min(1),
            description: z.string().min(1),
          }),
        ),

        achievements: z.array(
          z.object({
            id: z.string(),
            name: z.string().min(1),
            year: z.date(),
          }),
        ),
        affiliations: z.array(
          z.object({
            id: z.string(),
            org_name: z.string().min(1),
            org_position: z.string().min(1),
            start_year: z.date(),
            end_year: z.date(),
          }),
        ),
        eventsAttended: z.array(
          z.object({
            id: z.string(),
            name: z.string().min(1),
            year: z.date(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Validate commissioner

      if (input.old_slug !== input.new_slug) {
        const isCandidateSlugExists = await ctx.db.query.candidates.findFirst({
          where: (candidates, { eq, and }) =>
            and(
              eq(candidates.slug, input.new_slug),
              eq(candidates.election_id, input.election_id),
            ),
        });

        if (isCandidateSlugExists)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Candidate slug is already exists",
          });
      }

      await ctx.db.transaction(async (db) => {
        await db
          .update(candidates)
          .set({
            slug: input.new_slug,
            first_name: input.first_name,
            middle_name: input.middle_name,
            last_name: input.last_name,
            position_id: input.position_id,
            partylist_id: input.partylist_id,
            image_link: input.image_link,
          })
          .where(
            and(
              eq(candidates.id, input.id),
              eq(candidates.election_id, input.election_id),
            ),
          );

        for (const platform of input.platforms) {
          await db
            .insert(platforms)
            .values({
              id: platform.id,
              title: platform.title,
              description: platform.description,
              candidate_id: input.id,
            })
            .onDuplicateKeyUpdate({
              set: {
                title: platform.title,
                description: platform.description,
              },
            });
        }

        for (const affiliation of input.affiliations) {
          await db
            .insert(affiliations)
            .values({
              id: affiliation.id,
              org_name: affiliation.org_name,
              org_position: affiliation.org_position,
              start_year: affiliation.start_year,
              end_year: affiliation.end_year,
              credential_id: input.credential_id,
            })
            .onDuplicateKeyUpdate({
              set: {
                org_name: affiliation.org_name,
                org_position: affiliation.org_position,
                start_year: affiliation.start_year,
                end_year: affiliation.end_year,
                credential_id: input.credential_id,
              },
            });
        }

        for (const achievement of input.achievements) {
          await db
            .insert(achievements)
            .values({
              id: achievement.id,
              name: achievement.name,
              year: achievement.year,
              credential_id: input.credential_id,
            })
            .onDuplicateKeyUpdate({
              set: {
                name: achievement.name,
                year: achievement.year,
                credential_id: input.credential_id,
              },
            });
        }

        for (const event of input.eventsAttended) {
          await db
            .insert(events_attended)
            .values({
              id: event.id,
              name: event.name,
              year: event.year,
              credential_id: input.credential_id,
            })
            .onDuplicateKeyUpdate({
              set: {
                name: event.name,
                year: event.year,
                credential_id: input.credential_id,
              },
            });
        }
      });
    }),
  inviteAllInvitedVoters: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Validate commissioner
      const isElectionExists = await ctx.db.query.elections.findFirst({
        where: (elections, { eq }) => eq(elections.id, input.election_id),
        with: {
          commissioners: {
            where: (commissioners, { eq }) =>
              eq(commissioners.user_id, ctx.session.user.id),
          },
        },
      });
      if (!isElectionExists) throw new Error("Election does not exists");
      if (isElectionExists.commissioners.length === 0)
        throw new Error("Unauthorized");
      // const invitedVoters = await ctx.db.query.invited_voters.findMany({
      //   where: (invited_voters, { eq }) =>
      //     eq(invited_voters.election_id, input.election_id),
      // });
      // const invitedVotersIds = invitedVoters.map(
      //   (invitedVoter) => invitedVoter.id,
      // );
    }),
  createSingleVoter: protectedProcedure
    .input(
      z.object({
        email: z.string().min(1),
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const isElectionExists = await ctx.db.query.elections.findFirst({
        where: (elections, { eq }) => eq(elections.id, input.election_id),
        with: {
          commissioners: {
            where: (commissioners, { eq }) =>
              eq(commissioners.user_id, ctx.session.user.id),
          },
        },
      });

      if (!isElectionExists)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election does not exists",
        });

      if (isElectionExists.commissioners.length === 0)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });

      const voters = await ctx.db.query.voters.findMany({
        where: (voter, { eq }) => eq(voter.election_id, input.election_id),
        with: {
          user: true,
        },
      });

      const isVoterEmailExists = voters.some(
        (voter) => voter.user.email === input.email,
      );

      if (isVoterEmailExists)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email is already a voter",
        });
    }),
  updateVoterField: protectedProcedure
    .input(
      z.object({
        fields: z.array(
          z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            type: z.enum(["fromDb", "fromInput"]),
          }),
        ),
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.transaction(async (db) => {
        await db
          .delete(voter_fields)
          .where(eq(voter_fields.election_id, input.election_id));

        await db.insert(voter_fields).values(
          input.fields.map((field) => ({
            name: field.name,
            election_id: input.election_id,
          })),
        );
      });
    }),
  deleteSingleVoterField: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
        field_id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .delete(voter_fields)
        .where(
          and(
            eq(voter_fields.election_id, input.election_id),
            eq(voter_fields.id, input.field_id),
          ),
        );
    }),
  editVoter: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        email: z.string().min(1),
        election_id: z.string().min(1),
        account_status: z.enum(account_status_type_with_accepted),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Validate commissioner
      const isElectionExists = await ctx.db.query.elections.findFirst({
        where: (elections, { eq }) => eq(elections.id, input.election_id),
      });

      if (!isElectionExists)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election does not exists",
        });

      const isElectionCommissionerExists =
        await ctx.db.query.commissioners.findFirst({
          where: (commissioner, { eq, and }) =>
            and(
              eq(commissioner.election_id, input.election_id),
              eq(commissioner.user_id, ctx.session.user.id),
            ),
        });

      if (!isElectionCommissionerExists)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });

      await ctx.db
        .update(voters)
        .set({
          email: input.email,
        })
        .where(eq(voters.id, input.id));

      return { type: "voter" };
    }),
  deleteSingleVoter: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        election_id: z.string().min(1),
        is_invited_voter: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const isElectionExists = await ctx.db.query.elections.findFirst({
        where: (election, { eq }) => eq(election.id, input.election_id),
      });

      if (!isElectionExists)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election does not exists",
        });

      const isElectionCommissionerExists =
        await ctx.db.query.commissioners.findFirst({
          where: (commissioner, { eq, and }) =>
            and(
              eq(commissioner.election_id, input.election_id),
              eq(commissioner.user_id, ctx.session.user.id),
            ),
        });

      if (!isElectionCommissionerExists)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });

      if (!input.is_invited_voter) {
        const voter = await ctx.db.query.voters.findFirst({
          where: (voter, { eq, and }) =>
            and(
              eq(voter.id, input.id),
              eq(voter.election_id, input.election_id),
            ),
        });

        if (!voter)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Voter not found",
          });

        await ctx.db
          .delete(voters)
          .where(
            and(
              eq(voters.id, input.id),
              eq(voters.election_id, input.election_id),
            ),
          );
      }
    }),
  deleteBulkVoter: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
        voters: z.array(
          z.object({
            id: z.string().min(1),
            email: z.string().min(1),
            isVoter: z.boolean(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Validate commissioner
      const votersIds = input.voters
        .filter((voter) => voter.isVoter)
        .map((voter) => voter.id);

      if (votersIds.length)
        await ctx.db
          .delete(voters)
          .where(
            and(
              eq(voters.election_id, input.election_id),
              inArray(voters.id, votersIds),
            ),
          );

      return {
        count: votersIds.length,
      };
    }),
  uploadBulkVoter: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
        voters: z.array(
          z.object({
            email: z.string().min(1),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Validate commissioner
      const isElectionExists = await ctx.db.query.elections.findFirst({
        where: (elections, { eq }) => eq(elections.id, input.election_id),
        with: {
          commissioners: {
            where: (commissioners, { eq }) =>
              eq(commissioners.user_id, ctx.session.user.id),
          },
        },
      });

      if (!isElectionExists) throw new Error("Election does not exists");

      if (isElectionExists.commissioners.length === 0)
        throw new Error("Unauthorized");

      // await Promise.all(
      //   input.voters.map(async (voter) => {
      //     await isVoterOrInvitedVoterExists({
      //       election_id: input.election_id,
      //       email: voter.email,
      //     });
      //   }),
      // );

      return {
        count: input.voters.length,
      };
    }),
  deleteElection: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (db) => {
        await db
          .delete(commissioners)
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
