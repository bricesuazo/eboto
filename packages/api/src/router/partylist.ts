import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, eq } from "@eboto-mo/db";
import { partylists } from "@eboto-mo/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const partylistRouter = createTRPCRouter({
  getAllPartylistsByElectionId: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const partylists = await ctx.db.query.partylists.findMany({
        where: (partylists, { eq, and, isNull }) =>
          and(
            eq(partylists.election_id, input.election_id),
            isNull(partylists.deleted_at),
          ),
        orderBy: (partylists, { asc }) => asc(partylists.created_at),
      });

      return partylists;
    }),
  getDashboardData: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const partylists = await ctx.db.query.partylists.findMany({
        where: (partylists, { eq, and, isNull, not }) =>
          and(
            eq(partylists.election_id, input.election_id),
            not(eq(partylists.acronym, "IND")),
            isNull(partylists.deleted_at),
          ),
        orderBy: (partylists, { desc }) => desc(partylists.updated_at),
      });

      return partylists;
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        acronym: z.string().min(1),
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

      if (!commissioner) throw new TRPCError({ code: "UNAUTHORIZED" });

      const isAcronymExists = await ctx.db.query.partylists.findFirst({
        where: (partylist, { eq, and, isNull }) =>
          and(
            eq(partylist.election_id, input.election_id),
            eq(partylist.acronym, input.acronym),
            isNull(partylist.deleted_at),
          ),
      });

      if (isAcronymExists) throw new Error("Acronym is already exists");

      await ctx.db.insert(partylists).values({
        name: input.name,
        acronym: input.acronym,
        election_id: input.election_id,
      });
    }),
  edit: protectedProcedure
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

      if (!commissioner) throw new TRPCError({ code: "UNAUTHORIZED" });

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
  delete: protectedProcedure
    .input(
      z.object({
        partylist_id: z.string().min(1),
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

      if (!commissioner) throw new TRPCError({ code: "UNAUTHORIZED" });

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
});
