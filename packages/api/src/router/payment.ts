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
      const [election, boost] = await Promise.all([
        await ctx.db.query.elections.findFirst({
          where: (election, { eq, and, isNull }) =>
            and(
              eq(election.id, input.election_id),
              isNull(election.deleted_at),
            ),
        }),
        await ctx.db.query.variants.findFirst({
          where: (product, { eq, and }) =>
            and(
              eq(product.product_id, env.LEMONSQUEEZY_BOOST_PRODUCT_ID),
              eq(product.price, 499 + (input.price / 25) * 200),
            ),
        }),
      ]);

      if (!boost)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No boost found",
        });

      if (!election)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No election found",
        });

      const checkout = await ctx.payment
        .createCheckout(env.LEMONSQUEEZY_STORE_ID, boost.id, {
          productOptions: {
            redirectUrl: env.APP_URL + "/dashboard/" + election.slug,
            receiptLinkUrl: env.APP_URL + "/account/billing",
          },
          checkoutData: {
            email: ctx.session.user.email?.length
              ? ctx.session.user.email
              : undefined,
            name: ctx.session.user.name?.length
              ? ctx.session.user.name
              : undefined,
            custom: {
              user_id: ctx.session.user.id,
              election_id: input.election_id,
              type: "boost",
            },
          },
        })
        .catch((err) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create checkout",
            cause: err,
          });
        });

      return checkout.data?.data.attributes.url;
    }),
  plus: protectedProcedure
    .input(
      z.object({
        quantity: z.number().min(1, "Quantity must be at least 1"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const checkout = await ctx.payment
        .createCheckout(
          env.LEMONSQUEEZY_STORE_ID,
          env.LEMONSQUEEZY_PLUS_VARIANT_ID,
          {
            productOptions: {
              redirectUrl: env.APP_URL + "/dashboard",
              receiptLinkUrl: env.APP_URL + "/account/billing",
            },
            checkoutData: {
              email: ctx.session.user.email?.length
                ? ctx.session.user.email
                : undefined,
              name: ctx.session.user.name?.length
                ? ctx.session.user.name
                : undefined,
              variantQuantities: [
                {
                  variantId: env.LEMONSQUEEZY_PLUS_VARIANT_ID,
                  quantity: input.quantity,
                },
              ],
              custom: {
                user_id: ctx.session.user.id,
                type: "plus",
              },
            },
          },
        )
        .catch((err) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create checkout",
            cause: err,
          });
        });

      return checkout.data?.data.attributes.url;
    }),
});
