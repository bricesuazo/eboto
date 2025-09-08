import { TRPCError } from '@trpc/server';
import { z } from 'zod/v4';

import { env } from '../../../env';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const paymentRouter = createTRPCRouter({
  boost: protectedProcedure
    .input(
      z.object({
        election_id: z.uuid(),
        price: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [electionQuery, boostQuery, userQuery] = await Promise.all([
        await ctx.supabase
          .from('elections')
          .select()
          .eq('id', input.election_id)
          .is('deleted_at', null)
          .single(),
        await ctx.supabase
          .from('variants')
          .select()
          .eq('product_id', env.LEMONSQUEEZY_BOOST_PRODUCT_ID)
          .eq('price', 499 + (input.price / 25) * 200)
          .single(),
        await ctx.supabase
          .from('users')
          .select()
          .eq('id', ctx.user.auth.id)
          .single(),
      ]);

      const { data: election } = electionQuery;
      const { data: boost } = boostQuery;
      const { data: user } = userQuery;

      if (!boost)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No boost found',
        });

      if (!election)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No election found',
        });

      if (!user)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No user found',
        });

      const checkout = await ctx.payment
        .createCheckout(env.LEMONSQUEEZY_STORE_ID, boost.id, {
          productOptions: {
            redirectUrl: env.APP_URL + '/dashboard/' + election.slug,
            receiptLinkUrl: env.APP_URL + '/account/billing',
          },
          checkoutData: {
            email: ctx.user.auth.email?.length
              ? ctx.user.auth.email
              : undefined,
            name: user.name?.length ? user.name : undefined,
            custom: {
              user_id: ctx.user.auth.id,
              election_id: input.election_id,
              type: 'boost',
            },
          },
        })
        .catch((err) => {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create checkout',
            cause: err,
          });
        });

      return checkout.data?.data.attributes.url;
    }),
  plus: protectedProcedure
    .input(
      z.object({
        quantity: z.number().min(1, 'Quantity must be at least 1'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data: user } = await ctx.supabase
        .from('users')
        .select()
        .eq('id', ctx.user.auth.id)
        .single();

      if (!user)
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No user found' });

      const checkout = await ctx.payment
        .createCheckout(
          env.LEMONSQUEEZY_STORE_ID,
          env.LEMONSQUEEZY_PLUS_VARIANT_ID,
          {
            productOptions: {
              redirectUrl: env.APP_URL + '/dashboard',
              receiptLinkUrl: env.APP_URL + '/account/billing',
            },
            checkoutData: {
              email: ctx.user.db.email.length ? ctx.user.db.email : undefined,
              name: user.name?.length ? user.name : undefined,
              variantQuantities: [
                {
                  variantId: env.LEMONSQUEEZY_PLUS_VARIANT_ID,
                  quantity: input.quantity,
                },
              ],
              custom: {
                user_id: ctx.user.auth.id,
                type: 'plus',
              },
            },
          },
        )
        .catch((err) => {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create checkout',
            cause: err,
          });
        });

      return checkout.data?.data.attributes.url;
    }),
});
