import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '../trpc';

export const partylistRouter = createTRPCRouter({
  getAllPartylistsByElectionId: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: partylists } = await ctx.supabase
        .from('partylists')
        .select()
        .eq('election_id', input.election_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (!partylists) throw new TRPCError({ code: 'NOT_FOUND' });

      return partylists;
    }),
  getDashboardData: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: partylists } = await ctx.supabase
        .from('partylists')
        .select()
        .eq('election_id', input.election_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (!partylists) throw new TRPCError({ code: 'NOT_FOUND' });

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
      const { data: election } = await ctx.supabase
        .from('elections')
        .select()
        .eq('id', input.election_id)
        .is('deleted_at', null)
        .single();

      if (!election) throw new TRPCError({ code: 'NOT_FOUND' });

      const { data: commissioner } = await ctx.supabase
        .from('commissioners')
        .select()
        .eq('user_id', ctx.user.auth.id)
        .eq('election_id', election.id)
        .is('deleted_at', null)
        .single();

      if (!commissioner) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const { data: isAcronymExists } = await ctx.supabase
        .from('partylists')
        .select()
        .eq('election_id', input.election_id)
        .eq('acronym', input.acronym)
        .is('deleted_at', null)
        .single();

      if (isAcronymExists) throw new Error('Acronym is already exists');

      await ctx.supabase.from('partylists').insert({
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
        description: z.string().optional(),
        logo_url: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data: election } = await ctx.supabase
        .from('elections')
        .select()
        .eq('id', input.election_id)
        .is('deleted_at', null)
        .single();

      if (!election) throw new TRPCError({ code: 'NOT_FOUND' });

      const { data: commissioner } = await ctx.supabase
        .from('commissioners')
        .select()
        .eq('user_id', ctx.user.auth.id)
        .eq('election_id', election.id)
        .is('deleted_at', null)
        .single();

      if (!commissioner) throw new TRPCError({ code: 'UNAUTHORIZED' });

      if (input.newAcronym === 'IND')
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'IND is a reserved acronym',
        });

      if (input.oldAcronym !== input.newAcronym) {
        const { data: isAcronymExists } = await ctx.supabase
          .from('partylists')
          .select()
          .eq('election_id', input.election_id)
          .eq('acronym', input.newAcronym)
          .is('deleted_at', null)
          .single();

        if (isAcronymExists)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Acronym is already exists',
          });
      }

      await ctx.supabase
        .from('partylists')
        .update({
          name: input.name,
          acronym: input.newAcronym,
          description: input.description,
          // TODO: Implement logo upload
          // logo_link: input.logo_link,
        })
        .eq('id', input.id);
    }),
  delete: protectedProcedure
    .input(
      z.object({
        partylist_id: z.string().min(1),
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data: election } = await ctx.supabase
        .from('elections')
        .select()
        .eq('id', input.election_id)
        .is('deleted_at', null)
        .single();

      if (!election) throw new TRPCError({ code: 'NOT_FOUND' });

      const { data: commissioner } = await ctx.supabase
        .from('commissioners')
        .select()
        .eq('user_id', ctx.user.auth.id)
        .eq('election_id', election.id)
        .is('deleted_at', null)
        .single();

      if (!commissioner) throw new TRPCError({ code: 'UNAUTHORIZED' });

      await ctx.supabase
        .from('partylists')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', input.partylist_id)
        .eq('election_id', input.election_id);
    }),
});
