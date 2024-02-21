import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "../env.mjs";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const paymentRouter = createTRPCRouter({
  boost: protectedProcedure
    .input(
      z.object({
        election_id: z.string(),
        price: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const boost = await ctx.db.query.variants.findFirst({
        where: (product, { eq, and }) =>
          and(
            eq(product.product_id, env.LEMONSQUEEZY_BOOST_PRODUCT_ID),
            eq(product.price, 499 + (input.price / 25) * 200),
          ),
      });

      if (!boost)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No boost found",
        });
    }),
});
