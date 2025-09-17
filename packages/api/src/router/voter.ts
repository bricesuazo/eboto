import { TRPCError } from '@trpc/server';
import { v4 } from 'uuid';
import { z } from 'zod/v4';

import { isElectionEnded, isElectionOngoing } from '@eboto/constants';
import { EmailSchema } from '@eboto/constants/schema';

import { env } from '../../../env';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { LS_DATA_DEV, LS_DATA_PROD } from './../../../../supabase/seed';

export const voterRouter = createTRPCRouter({
  createSingle: protectedProcedure
    .input(
      z.object({
        email: EmailSchema,
        election_id: z.uuid(),
        voter_fields: z.array(
          z.object({
            id: z.string(),
            value: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from('elections')
        .select(
          'id, variant:variants(id, name), no_of_voters, commissioners(id)',
        )
        .eq('id', input.election_id)
        .is('deleted_at', null)
        .eq('commissioners.user_id', ctx.user.auth.id)
        .single();

      if (!election)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Election does not exists',
        });

      if (election.commissioners.length === 0)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        });

      const { count: voters_count } = await ctx.supabase
        .from('voters')
        .select('id', { count: 'exact' })
        .eq('election_id', input.election_id)
        .is('deleted_at', null);

      const data =
        process.env.NODE_ENV === 'development' ? LS_DATA_DEV : LS_DATA_PROD;

      const variant = data.products
        .flatMap((product) => product.variants)
        .find((variant) => variant.id === election.variant.id);

      if (!variant) throw new TRPCError({ code: 'NOT_FOUND' });

      if ((voters_count ?? 0) >= variant.voters)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Maximum number of voters reached. Maximum no. of voters is ' +
            variant.voters +
            '.',
        });

      const { data: voters, error: voters_error } = await ctx.supabase
        .from('voters')
        .select('email')
        .eq('election_id', input.election_id)
        .is('deleted_at', null);

      if (voters_error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: voters_error.message,
        });

      if (
        voters.find((voter) => voter.email.replace(/\s+/g, '') === input.email)
      )
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email is already a voter',
        });

      if (election.no_of_voters) {
        if (voters.length + 1 >= election.no_of_voters)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Maximum number of voters reached. Maximum no. of voters is ' +
              election.no_of_voters +
              '.',
          });
      } else {
        const is_free =
          env.LEMONSQUEEZY_FREE_VARIANT_ID === election.variant.id;

        if (is_free && voters.length + 1 >= 500)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Maximum number of voters reached. Maximum no. of voters is 500.',
          });

        if (!is_free) {
          const no_of_voters = parseInt(
            (/[\d,]+/.exec(election.variant.name)?.[0] ?? '').replace(',', ''),
          );

          if (voters.length + 1 >= no_of_voters)
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message:
                'Maximum number of voters reached. Maximum no. of voters is ' +
                no_of_voters +
                '.',
            });
        }
      }

      await ctx.supabase.from('voters').insert({
        email: input.email,
        election_id: election.id,
        field: input.voter_fields.reduce(
          (acc, field) => {
            acc[field.id] = field.value;
            return acc;
          },
          {} as Record<string, string>,
        ),
      });
    }),
  getAllVoterField: protectedProcedure
    .input(
      z.object({
        election_id: z.uuid(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { data: isElectionExists } = await ctx.supabase
        .from('elections')
        .select('id')
        .eq('id', input.election_id)
        .is('deleted_at', null)
        .single();

      if (!isElectionExists)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Election does not exists',
        });

      const { data: isElectionCommissionerExists } = await ctx.supabase
        .from('commissioners')
        .select('id')
        .eq('election_id', input.election_id)
        .eq('user_id', ctx.user.auth.id)
        .is('deleted_at', null)
        .single();

      if (!isElectionCommissionerExists)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        });

      const { data: voter_fields, error: voter_fields_error } =
        await ctx.supabase
          .from('voter_fields')
          .select('id, name')
          .eq('election_id', input.election_id)
          .is('deleted_at', null);

      if (voter_fields_error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: voter_fields_error.message,
        });

      return voter_fields;
    }),
  updateVoterField: protectedProcedure
    .input(
      z.object({
        fields: z.array(
          z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            type: z.enum(['fromDb', 'fromInput']),
          }),
        ),
        election_id: z.uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data: election } = await ctx.supabase
        .from('elections')
        .select('start_date, end_date, voting_hour_start, voting_hour_end')
        .eq('id', input.election_id)
        .is('deleted_at', null)
        .single();

      if (!election)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Election does not exists',
        });

      if (isElectionOngoing({ election }))
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Election is ongoing',
        });

      if (isElectionEnded({ election }))
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Election is ended',
        });

      if (
        input.fields.some((field) => field.name.toLowerCase().includes('email'))
      )
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Field cannot be added',
        });

      await ctx.supabase.from('voter_fields').upsert(
        input.fields.map((field) => ({
          id: field.type === 'fromDb' ? field.id : v4(),
          name: field.name,
          election_id: input.election_id,
        })),
        { ignoreDuplicates: true, onConflict: 'id' },
      );
    }),
  deleteSingleVoterField: protectedProcedure
    .input(
      z.object({
        election_id: z.uuid(),
        field_id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.supabase
        .from('voter_fields')
        .delete()
        .eq('id', input.field_id)
        .eq('election_id', input.election_id);
    }),
  edit: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        email: EmailSchema,
        election_id: z.uuid(),
        voter_fields: z.array(
          z.object({
            id: z.string().min(1),
            value: z.string().optional(),
          }),
        ),
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

      const { data: isElectionCommissionerExists } = await ctx.supabase
        .from('commissioners')
        .select('id')
        .eq('election_id', input.election_id)
        .eq('user_id', ctx.user.auth.id)
        .is('deleted_at', null)
        .single();

      if (!isElectionCommissionerExists)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        });

      await ctx.supabase
        .from('voters')
        .update({
          email: input.email,
          field: input.voter_fields.reduce(
            (acc, field) => {
              acc[field.id] = field.value ?? '';
              return acc;
            },
            {} as Record<string, string>,
          ),
        })
        .eq('id', input.id);

      return { type: 'voter' };
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        election_id: z.uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data: isElectionExists } = await ctx.supabase
        .from('elections')
        .select('id')
        .eq('id', input.election_id)
        .is('deleted_at', null)
        .single();

      if (!isElectionExists)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Election does not exists',
        });

      const { data: isElectionCommissionerExists } = await ctx.supabase
        .from('commissioners')
        .select('id')
        .eq('election_id', input.election_id)
        .eq('user_id', ctx.user.auth.id)
        .is('deleted_at', null)
        .single();

      if (!isElectionCommissionerExists)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        });

      const { data: voter } = await ctx.supabase
        .from('voters')
        .select('id')
        .eq('id', input.id)
        .eq('election_id', input.election_id)
        .is('deleted_at', null)
        .single();

      if (!voter)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Voter not found',
        });

      await ctx.supabase
        .from('voters')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', input.id)
        .eq('election_id', input.election_id);
    }),
  deleteBulk: protectedProcedure
    .input(
      z.object({
        election_id: z.uuid(),
        voters: z.array(
          z.object({
            id: z.string().min(1),
            email: EmailSchema,
          }),
        ),
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

      await ctx.supabase
        .from('voters')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq('election_id', input.election_id)
        .in(
          'id',
          input.voters.map((voter) => voter.id),
        );

      return {
        count: input.voters.map((voter) => voter.id).length,
      };
    }),
  uploadBulk: protectedProcedure
    .input(
      z.object({
        election_id: z.uuid(),
        voters: z.array(
          z.object({
            email: EmailSchema,
            field: z.record(z.string(), z.string()),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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

      // await ctx.db.transaction(async (db) => {
      // TODO: use transaction
      const { data: myElection } = await ctx.supabase
        .from('elections')
        .select(
          'id, no_of_voters, commissioners(id), variant: variants(id, name)',
        )
        .eq('id', input.election_id)
        .is('deleted_at', null)
        .eq('commissioners.user_id', ctx.user.auth.id)
        .single();

      if (!myElection) throw new Error('Election does not exists');

      if (myElection.commissioners.length === 0)
        throw new Error('Unauthorized');

      const { data: voters, error: voters_length_error } = await ctx.supabase
        .from('voters')
        .select('id')
        .eq('election_id', input.election_id)
        .is('deleted_at', null);

      if (voters_length_error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: voters_length_error.message,
        });

      const data =
        process.env.NODE_ENV === 'development' ? LS_DATA_DEV : LS_DATA_PROD;

      const variant = data.products
        .flatMap((product) => product.variants)
        .find((variant) => variant.id === myElection.variant.id);

      if (!variant) throw new TRPCError({ code: 'NOT_FOUND' });

      if (voters.length >= variant.voters)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Maximum number of voters reached. Maximum no. of voters is ' +
            variant.voters +
            '.',
        });

      const { data: votersFromDb, error: votersFromDbError } =
        await ctx.supabase
          .from('voters')
          .select('email')
          .eq('election_id', input.election_id)
          .is('deleted_at', null);

      if (votersFromDbError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: votersFromDbError.message,
        });

      const uniqueVoters = input.voters.filter(
        (voter) =>
          !votersFromDb.some(
            (voterFromDb) =>
              voterFromDb.email.replace(/\s+/g, '') === voter.email,
          ),
      );

      if (myElection.no_of_voters) {
        if (voters.length + uniqueVoters.length >= myElection.no_of_voters)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Maximum number of voters reached. Maximum no. of voters is ' +
              myElection.no_of_voters +
              '.',
          });
      } else {
        const is_free =
          env.LEMONSQUEEZY_FREE_VARIANT_ID === myElection.variant.id;

        if (is_free && voters.length + uniqueVoters.length >= 500)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Maximum number of voters reached. Maximum no. of voters is 500.',
          });

        if (!is_free) {
          const no_of_voters = parseInt(
            (/[\d,]+/.exec(myElection.variant.name)?.[0] ?? '').replace(
              ',',
              '',
            ),
          );

          if (voters.length + uniqueVoters.length >= no_of_voters)
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message:
                'Maximum number of voters reached. Maximum no. of voters is ' +
                no_of_voters +
                '.',
            });
        }
      }

      const { data: uploaded_voters, error: uploaded_voters_error } =
        await ctx.supabase
          .from('voters')
          .insert(
            uniqueVoters.map((voter) => ({
              election_id: myElection.id,
              email: voter.email,
              field: voter.field,
            })),
          )
          .select('id');

      if (uploaded_voters_error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: uploaded_voters_error.message,
        });
      // });

      return {
        count: uploaded_voters.length,
      };
    }),
  addVoterFieldToVoter: protectedProcedure
    .input(
      z.object({
        election_id: z.uuid(),
        voter_id: z.string().min(1),
        fields: z.array(
          z.object({
            id: z.string().min(1),
            value: z.string().min(1),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data: election } = await ctx.supabase
        .from('elections')
        .select('publicity')
        .eq('id', input.election_id)
        .is('deleted_at', null)
        .single();

      if (!election)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Election does not exists',
        });

      if (election.publicity === 'PRIVATE')
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        });

      const { data: voter } = await ctx.supabase
        .from('voters')
        .select('id')
        .eq('id', input.voter_id)
        .eq('election_id', input.election_id)
        .is('deleted_at', null)
        .single();

      if (!voter)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Voter does not exists',
        });

      await ctx.supabase
        .from('voters')
        .update({
          field: input.fields.reduce(
            (acc, field) => {
              acc[field.id] = field.value;
              return acc;
            },
            {} as Record<string, string>,
          ),
        })
        .eq('id', input.voter_id)
        .eq('election_id', input.election_id);
    }),
});
