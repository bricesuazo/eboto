import { z } from "zod";

import { and, eq } from "@eboto-mo/db";
import { positions } from "@eboto-mo/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const positionRouter = createTRPCRouter({
  getDashboardData: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const positions = await ctx.db.query.positions.findMany({
        where: (positions, { eq, and, isNull }) =>
          and(
            eq(positions.election_id, input.election_id),
            isNull(positions.deleted_at),
          ),
        orderBy: (positions, { asc }) => asc(positions.order),
      });

      return positions;
    }),
  create: protectedProcedure
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
  delete: protectedProcedure
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
  edit: protectedProcedure
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
      // const positionsInDB = await ctx.db.query.positions.findMany({
      //   where: (position, { eq }) =>
      //     eq(position.election_id, input.election_id),
      //   columns: {
      //     id: true,
      //   },
      // });

      await ctx.db
        .update(positions)
        .set({
          name: input.name,
          description: input.description,
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
});
