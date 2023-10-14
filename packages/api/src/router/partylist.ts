import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, eq } from "@eboto-mo/db";
import { partylists } from "@eboto-mo/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const partylistRouter = createTRPCRouter({
  getAllPartylistsByElectionId: protectedProcedure
    .input(
      z.object({
        election_id: z.string().nonempty(),
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
        election_id: z.string().nonempty(),
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
        name: z.string().nonempty(),
        acronym: z.string().nonempty(),
        election_id: z.string().nonempty(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Validate commissioner
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
        id: z.string().nonempty(),
        name: z.string().nonempty(),
        oldAcronym: z.string().optional(),
        newAcronym: z.string().nonempty(),
        election_id: z.string().nonempty(),
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
  delete: protectedProcedure
    .input(
      z.object({
        partylist_id: z.string().nonempty(),
        election_id: z.string().nonempty(),
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
});
