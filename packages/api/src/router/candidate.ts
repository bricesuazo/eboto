import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";

import { and, eq } from "@eboto/db";
import {
  achievements,
  affiliations,
  candidates,
  credentials,
  events_attended,
  platforms,
} from "@eboto/db/schema";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const candidateRouter = createTRPCRouter({
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
  edit: protectedProcedure
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
        image: z
          .object({
            name: z.string().min(1),
            type: z.string().min(1),
            base64: z.string().min(1),
          })
          .nullish(),

        credential_id: z.string().min(1),

        platforms: z.array(
          z.object({
            id: z.string(),
            title: z.string().min(1),
            description: z.string(),
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
      const election = await ctx.db.query.elections.findFirst({
        where: (election, { eq, and, isNull }) =>
          and(eq(election.id, input.election_id), isNull(election.deleted_at)),
      });

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      const commissioner = await ctx.db.query.commissioners.findFirst({
        where: (commissioner, { eq, and, isNull }) =>
          and(
            eq(commissioner.user_id, ctx.session.user.id),
            eq(commissioner.election_id, election.id),
            isNull(commissioner.deleted_at),
          ),
      });

      if (!commissioner) throw new TRPCError({ code: "NOT_FOUND" });

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
        const candidate = await db.query.candidates.findFirst({
          where: (candidates, { eq, and }) =>
            and(
              eq(candidates.slug, input.old_slug),
              eq(candidates.election_id, input.election_id),
            ),
        });

        if (!candidate)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Candidate not found",
          });

        if (candidate.image && (input.image === null || !!input.image)) {
          await ctx.utapi.deleteFiles(candidate.image.key);
        }

        await db
          .update(candidates)
          .set({
            slug: input.new_slug,
            first_name: input.first_name,
            middle_name: input.middle_name,
            last_name: input.last_name,
            position_id: input.position_id,
            partylist_id: input.partylist_id,
            image: input.image
              ? await fetch(input.image.base64)
                  .then((res) => res.blob())
                  .then(
                    async (blob) =>
                      (
                        await ctx.utapi.uploadFiles(
                          new File(
                            [blob],
                            `candidate_image_${input.id}_${input.image!.name}`,
                            {
                              type: input.image!.type,
                            },
                          ),
                        )
                      ).data,
                  )
              : input.image,
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
  createSingle: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(1).trim().toLowerCase(),
        first_name: z.string().min(1),
        middle_name: z.string().nullable(),
        last_name: z.string().min(1),
        election_id: z.string().min(1),
        position_id: z.string().min(1),
        partylist_id: z.string().min(1),
        image: z
          .object({
            name: z.string().min(1),
            type: z.string().min(1),
            base64: z.string().min(1),
          })
          .nullable(),

        platforms: z.array(
          z.object({
            title: z.string().min(1),
            description: z.string(),
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
      const election = await ctx.db.query.elections.findFirst({
        where: (election, { eq, and, isNull }) =>
          and(eq(election.id, input.election_id), isNull(election.deleted_at)),
      });

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      const commissioner = await ctx.db.query.commissioners.findFirst({
        where: (commissioner, { eq, and, isNull }) =>
          and(
            eq(commissioner.user_id, ctx.session.user.id),
            eq(commissioner.election_id, election.id),
            isNull(commissioner.deleted_at),
          ),
      });

      if (!commissioner) throw new TRPCError({ code: "NOT_FOUND" });

      const isCandidateSlugExists = await ctx.db.query.candidates.findFirst({
        where: (candidate, { eq, and, isNull }) =>
          and(
            eq(candidate.slug, input.slug),
            eq(candidate.election_id, input.election_id),
            isNull(candidate.deleted_at),
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
          image:
            input.image &&
            (await fetch(input.image.base64)
              .then((res) => res.blob())
              .then(
                async (blob) =>
                  (
                    await ctx.utapi.uploadFiles(
                      new File(
                        [blob],
                        `candidate_image_${candidateId}_${input.image!.name}`,
                        {
                          type: input.image!.type,
                        },
                      ),
                    )
                  ).data,
              )),
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
  delete: protectedProcedure
    .input(
      z.object({
        candidate_id: z.string().min(1),
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const election = await ctx.db.query.elections.findFirst({
        where: (election, { eq, and, isNull }) =>
          and(eq(election.id, input.election_id), isNull(election.deleted_at)),
      });

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      const commissioner = await ctx.db.query.commissioners.findFirst({
        where: (commissioner, { eq, and, isNull }) =>
          and(
            eq(commissioner.user_id, ctx.session.user.id),
            eq(commissioner.election_id, election.id),
            isNull(commissioner.deleted_at),
          ),
      });

      if (!commissioner) throw new TRPCError({ code: "NOT_FOUND" });

      const candidate = await ctx.db.query.candidates.findFirst({
        where: (candidates, { eq, and, isNull }) =>
          and(
            eq(candidates.id, input.candidate_id),
            eq(candidates.election_id, input.election_id),
            isNull(candidates.deleted_at),
          ),
      });

      if (!candidate)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Candidate not found",
        });

      await ctx.db
        .update(candidates)
        .set({
          deleted_at: new Date(),
        })
        .where(
          and(
            eq(candidates.id, input.candidate_id),
            eq(candidates.election_id, input.election_id),
          ),
        );
    }),
  getDashboardData: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const positionsWithCandidates = await ctx.db.query.positions.findMany({
        where: (position, { eq, and, isNull }) =>
          and(
            eq(position.election_id, input.election_id),
            isNull(position.deleted_at),
          ),
        orderBy: (position, { asc }) => asc(position.order),
        with: {
          candidates: {
            where: (candidate, { eq, and, isNull }) =>
              and(
                eq(candidate.election_id, input.election_id),
                isNull(candidate.deleted_at),
              ),
            with: {
              partylist: true,
              credential: {
                columns: {
                  id: true,
                },
                with: {
                  affiliations: {
                    columns: {
                      id: true,
                      org_name: true,
                      org_position: true,
                      start_year: true,
                      end_year: true,
                    },
                  },
                  achievements: {
                    columns: {
                      id: true,
                      name: true,
                      year: true,
                    },
                  },
                  events_attended: {
                    columns: {
                      id: true,
                      name: true,
                      year: true,
                    },
                  },
                },
              },
              platforms: {
                columns: {
                  id: true,
                  title: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      return positionsWithCandidates;
    }),
  getPageData: publicProcedure
    .input(
      z.object({
        election_slug: z.string().min(1),
        candidate_slug: z.string().min(1),
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
          voters: {
            where: (voter, { eq, and, isNull }) =>
              and(
                eq(voter.email, ctx.session?.user.email ?? ""),
                isNull(voter.deleted_at),
              ),
          },
          commissioners: {
            where: (commissioner, { eq, and, isNull }) =>
              and(
                eq(commissioner.user_id, ctx.session?.user.id ?? ""),
                isNull(commissioner.deleted_at),
              ),
            with: {
              user: true,
            },
          },
        },
      });

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      const candidate = await ctx.db.query.candidates.findFirst({
        where: (candidate, { eq, and, isNull }) =>
          and(
            eq(candidate.election_id, election.id),
            eq(candidate.slug, input.candidate_slug),
            isNull(candidate.deleted_at),
          ),
        with: {
          partylist: true,
          position: true,
          platforms: true,
          credential: {
            with: {
              achievements: true,
              affiliations: true,
              events_attended: true,
            },
          },
        },
      });

      if (!candidate) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        election,
        candidate,
        isVoterCanMessage:
          election.publicity !== "PRIVATE" &&
          election.voters.some(
            (voter) => voter.email === ctx.session?.user.email,
          ) &&
          !election.commissioners.some(
            (commissioner) =>
              commissioner.user.email === ctx.session?.user.email,
          ),
      };
    }),
});
