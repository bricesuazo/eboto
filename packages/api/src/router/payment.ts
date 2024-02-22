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
        .createCheckout({
          storeId: parseInt(env.LEMONSQUEEZY_STORE_ID),
          variantId: parseInt(boost.id),
          attributes: {
            product_options: {
              redirect_url: env.APP_URL + "/dashboard/" + election.slug,
              receipt_link_url: env.APP_URL + "/account/billing",
            },
            checkout_data: {
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
          },
        })
        .catch((err) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create checkout",
            cause: err,
          });
        });

      return checkout.data.attributes.url;
    }),
  plus: protectedProcedure.mutation(async ({ ctx }) => {
    const checkout = await ctx.payment
      .createCheckout({
        storeId: parseInt(env.LEMONSQUEEZY_STORE_ID),
        variantId: parseInt(env.LEMONSQUEEZY_PLUS_VARIANT_ID),
        attributes: {
          product_options: {
            redirect_url: env.APP_URL + "/account/billing",
            receipt_link_url: env.APP_URL + "/account/billing",
          },
          checkout_data: {
            email: ctx.session.user.email?.length
              ? ctx.session.user.email
              : undefined,
            name: ctx.session.user.name?.length
              ? ctx.session.user.name
              : undefined,
            custom: {
              user_id: ctx.session.user.id,
              type: "plus",
            },
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

    return checkout.data.attributes.url;
  }),
});
