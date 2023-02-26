import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const partylistRouter = createTRPCRouter({
  createSingle: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        acronym: z.string().min(1),
        electionId: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.partylist.create({
        data: {
          name: input.name,
          acronym: input.acronym,
          electionId: input.electionId,
        },
      });
    }),
  getAll: protectedProcedure
    .input(z.string().min(1))
    .query(async ({ input, ctx }) => {
      const election = await ctx.prisma.election.findUniqueOrThrow({
        where: {
          slug: input,
        },
        select: {
          id: true,
        },
      });

      const partylists = await ctx.prisma.partylist.findMany({
        where: {
          electionId: election.id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return { partylists, election };
    }),
});
