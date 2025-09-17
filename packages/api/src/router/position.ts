import { TRPCError } from '@trpc/server';
import { z } from 'zod/v4';

import { createTRPCRouter, protectedProcedure } from '../trpc';

export const positionRouter = createTRPCRouter({
  getDashboardData: protectedProcedure
    .input(
      z.object({
        election_slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: election, error: election_error } = await ctx.supabase
        .from('elections')
        .select('id')
        .eq('slug', input.election_slug)
        .is('deleted_at', null)
        .single();

      if (election_error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: election_error.message,
        });

      const { data: positions, error: positions_error } = await ctx.supabase
        .from('positions')
        .select('id, name, min, max, description, order, election_id')
        .eq('election_id', election.id)
        .is('deleted_at', null)
        .order('order', { ascending: true });

      if (positions_error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: positions_error.message,
        });

      return { election: { id: election.id }, positions };
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        min: z.number().nonnegative().optional(),
        max: z.number().nonnegative().optional(),
        election_id: z.uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data: election } = await ctx.supabase
        .from('elections')
        .select('id')
        .eq('id', input.election_id)
        .is('deleted_at', null)
        .single();

      if (!election) throw new TRPCError({ code: 'NOT_FOUND' });

      const { data: commissioner } = await ctx.supabase
        .from('commissioners')
        .select('id')
        .eq('user_id', ctx.user.auth.id)
        .eq('election_id', election.id)
        .is('deleted_at', null)
        .single();

      if (!commissioner) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const { data: positions, error: positions_error } = await ctx.supabase
        .from('positions')
        .select('id')
        .eq('election_id', input.election_id)
        .is('deleted_at', null)
        .order('order', { ascending: true });

      if (positions_error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: positions_error.message,
        });

      await ctx.supabase.from('positions').insert({
        name: input.name,
        order: positions.length,
        min: input.min,
        max: input.max,
        election_id: input.election_id,
      });
    }),
  delete: protectedProcedure
    .input(
      z.object({
        position_id: z.string().min(1),
        election_id: z.uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data: election } = await ctx.supabase
        .from('elections')
        .select('id')
        .eq('id', input.election_id)
        .is('deleted_at', null)
        .single();

      if (!election) throw new TRPCError({ code: 'NOT_FOUND' });

      const { data: commissioner } = await ctx.supabase
        .from('commissioners')
        .select('id')
        .eq('user_id', ctx.user.auth.id)
        .eq('election_id', election.id)
        .is('deleted_at', null)
        .single();

      if (!commissioner) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const { data: position } = await ctx.supabase
        .from('positions')
        .select('id')
        .eq('id', input.position_id)
        .eq('election_id', input.election_id)
        .is('deleted_at', null)
        .single();

      if (!position) throw new TRPCError({ code: 'NOT_FOUND' });

      await ctx.supabase
        .from('positions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', input.position_id)
        .eq('election_id', input.election_id);
    }),
  edit: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        min: z.number().nonnegative().optional(),
        max: z.number().nonnegative().optional(),
        election_id: z.uuid(),
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

      await ctx.supabase
        .from('positions')
        .update({
          name: input.name,
          description: input.description,
          min: input.min,
          max: input.max,
        })
        .eq('id', input.id)
        .eq('election_id', input.election_id);
    }),
});
