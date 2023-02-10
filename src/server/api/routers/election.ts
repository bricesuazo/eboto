import { z } from "zod";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const electionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        slug: z.string(),
        start_date: z.string(),
        end_date: z.string(),
        voting_start: z.number().nullish(),
        voting_end: z.number().nullish(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const isElectionExists = await ctx.prisma.election.findUnique({
        where: {
          slug: input.slug,
        },
      });

      if (isElectionExists) {
        throw new Error("Election already exists");
      }

      return ctx.prisma.election.create({
        data: {
          name: input.name,
          slug: input.slug,
          start_date: input.start_date,
          end_date: input.end_date,
          voting_start: input.voting_start ? input.voting_start : undefined,
          voting_end: input.voting_end ? input.voting_end : undefined,
        },
      });
    }),
});
