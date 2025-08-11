import { TRPCError } from '@trpc/server';
import { z } from 'zod/v4';

import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

export const candidateRouter = createTRPCRouter({
  deleteSingleCredential: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        type: z.enum(['ACHIEVEMENT', 'AFFILIATION', 'EVENTATTENDED']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.type === 'ACHIEVEMENT') {
        return ctx.supabase
          .from('achievements')
          .update({
            deleted_at: new Date().toISOString(),
          })
          .eq('id', input.id);
      } else if (input.type === 'AFFILIATION') {
        return ctx.supabase
          .from('affiliations')
          .update({
            deleted_at: new Date().toISOString(),
          })
          .eq('id', input.id);
      } else {
        return ctx.supabase
          .from('events_attended')
          .update({
            deleted_at: new Date().toISOString(),
          })
          .eq('id', input.id);
      }
    }),
  deleteSinglePlatform: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.supabase
        .from('platforms')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq('id', input.id);
    }),
  edit: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        old_slug: z.string().min(1).trim(),
        new_slug: z.string().min(1).trim(),
        first_name: z.string().min(1),
        middle_name: z.string().nullable(),
        last_name: z.string().min(1),
        election_id: z.string().min(1),
        position_id: z.string().min(1),
        partylist_id: z.string().min(1),
        image: z
          .object({
            name: z.string().min(1),
            type: z.string().min(1),
            base64: z.string().min(1),
          })
          .nullish(),

        credential_id: z.string().min(1),

        platforms: z.array(
          z.object({
            id: z.string(),
            title: z.string().min(1),
            description: z.string().optional(),
          }),
        ),

        achievements: z.array(
          z.object({
            id: z.string(),
            name: z.string().min(1),
            year: z.string(),
          }),
        ),
        affiliations: z.array(
          z.object({
            id: z.string(),
            org_name: z.string().min(1),
            org_position: z.string().min(1),
            start_year: z.string(),
            end_year: z.string(),
          }),
        ),
        events_attended: z.array(
          z.object({
            id: z.string(),
            name: z.string().min(1),
            year: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data: election } = await ctx.supabase
        .from('elections')
        .select('*')
        .eq('id', input.election_id)
        .is('deleted_at', null)
        .single();

      if (!election) throw new TRPCError({ code: 'NOT_FOUND' });

      const { data: commissioner } = await ctx.supabase
        .from('commissioners')
        .select('*')
        .eq('user_id', ctx.user.auth.id)
        .eq('election_id', election.id)
        .is('deleted_at', null)
        .single();

      if (!commissioner) throw new TRPCError({ code: 'NOT_FOUND' });

      if (input.old_slug !== input.new_slug) {
        const { data: is_candidate_slug_exists } = await ctx.supabase
          .from('candidates')
          .select('*')
          .eq('slug', input.new_slug)
          .eq('election_id', input.election_id)
          .is('deleted_at', null)
          .single();

        if (is_candidate_slug_exists)
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Candidate slug is already exists',
          });
      }

      // TODO: add transaction
      const { data: candidate } = await ctx.supabase
        .from('candidates')
        .select('*')
        .eq('slug', input.old_slug)
        .eq('election_id', input.election_id)
        .is('deleted_at', null)
        .single();

      if (!candidate)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Candidate not found',
        });

      if (candidate.image_path && (input.image === null || input.image)) {
        await ctx.supabase.storage
          .from('candidates')
          .remove([candidate.image_path]);
      }

      await Promise.all([
        ctx.supabase
          .from('candidates')
          .update({
            slug: input.new_slug,
            first_name: input.first_name,
            middle_name: input.middle_name,
            last_name: input.last_name,
            position_id: input.position_id,
            partylist_id: input.partylist_id,
            image_path: input.image
              ? await fetch(input.image.base64)
                  .then((res) => res.blob())
                  .then(async (blob) => {
                    const { data } = await ctx.supabase.storage
                      .from('candidates')
                      .upload(`${input.id}/images/${Date.now()}`, blob);

                    return data?.path;
                  })
              : input.image,
          })
          .eq('id', input.id)
          .eq('election_id', input.election_id)
          .is('deleted_at', null),
        ctx.supabase.from('platforms').upsert(
          input.platforms.map((platform) => ({
            id: platform.id,
            title: platform.title,
            description: platform.description,
            candidate_id: input.id,
          })),
        ),
        ctx.supabase.from('affiliations').upsert(
          input.affiliations.map((affiliation) => ({
            id: affiliation.id,
            org_name: affiliation.org_name,
            org_position: affiliation.org_position,
            start_year: new Date(affiliation.start_year).toDateString(),
            end_year: new Date(affiliation.end_year).toDateString(),
            credential_id: input.credential_id,
          })),
        ),
        ctx.supabase.from('achievements').upsert(
          input.achievements.map((achievement) => ({
            id: achievement.id,
            name: achievement.name,
            year: new Date(achievement.year).toDateString(),
            credential_id: input.credential_id,
          })),
        ),
        ctx.supabase.from('events_attended').upsert(
          input.events_attended.map((event) => ({
            id: event.id,
            name: event.name,
            year: new Date(event.year).toDateString(),
            credential_id: input.credential_id,
          })),
        ),
      ]);
    }),
  createSingle: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(1).trim().toLowerCase(),
        first_name: z.string().min(1),
        middle_name: z.string().nullable(),
        last_name: z.string().min(1),
        election_id: z.string().min(1),
        position_id: z.string().min(1),
        partylist_id: z.string().min(1),
        image: z
          .object({
            name: z.string().min(1),
            type: z.string().min(1),
            base64: z.string().min(1),
          })
          .nullable(),

        platforms: z.array(
          z.object({
            title: z.string().min(1),
            description: z.string().optional(),
          }),
        ),

        achievements: z.array(
          z.object({
            name: z.string().min(1),
            year: z.string(),
          }),
        ),
        affiliations: z.array(
          z.object({
            org_name: z.string().min(1),
            org_position: z.string().min(1),
            start_year: z.string(),
            end_year: z.string(),
          }),
        ),
        events_attended: z.array(
          z.object({
            name: z.string().min(1),
            year: z.string(),
          }),
        ),
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

      if (!commissioner) throw new TRPCError({ code: 'NOT_FOUND' });

      const { data: isCandidateSlugExists } = await ctx.supabase
        .from('candidates')
        .select()
        .eq('slug', input.slug)
        .eq('election_id', input.election_id)
        .is('deleted_at', null)
        .single();

      if (isCandidateSlugExists)
        throw new Error('Candidate slug is already exists');

      // TODO: add transaction
      const { data: credential, error: credential_error } = await ctx.supabase
        .from('credentials')
        .insert({})
        .select('id')
        .single();

      if (credential_error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: credential_error.message,
        });

      const { data: candidate, error: candidate_error } = await ctx.supabase
        .from('candidates')
        .insert({
          slug: input.slug,
          first_name: input.first_name,
          middle_name: input.middle_name,
          last_name: input.last_name,
          election_id: input.election_id,
          position_id: input.position_id,
          partylist_id: input.partylist_id,
          credential_id: credential.id,
        })
        .select('id')
        .single();

      if (candidate_error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: candidate_error.message,
        });

      if (input.image) {
        await ctx.supabase
          .from('candidates')
          .update({
            image_path: await fetch(input.image.base64)
              .then((res) => res.blob())
              .then(async (blob) => {
                const { data } = await ctx.supabase.storage
                  .from('candidates')
                  .upload(`${candidate.id}/images/${Date.now()}`, blob);

                return data?.path;
              }),
          })
          .eq('id', candidate.id);
      }

      await Promise.all([
        ctx.supabase.from('platforms').insert(
          input.platforms.map((platform) => ({
            title: platform.title,
            description: platform.description,
            candidate_id: candidate.id,
          })),
        ),
        ctx.supabase.from('affiliations').insert(
          input.affiliations.map((affiliation) => ({
            org_name: affiliation.org_name,
            org_position: affiliation.org_position,
            start_year: new Date(affiliation.start_year).toDateString(),
            end_year: new Date(affiliation.end_year).toDateString(),
            credential_id: credential.id,
          })),
        ),
        ctx.supabase.from('achievements').insert(
          input.achievements.map((achievement) => ({
            name: achievement.name,
            year: new Date(achievement.year).toDateString(),
            credential_id: credential.id,
          })),
        ),
        ctx.supabase.from('events_attended').insert(
          input.events_attended.map((event) => ({
            name: event.name,
            year: new Date(event.year).toDateString(),
            credential_id: credential.id,
          })),
        ),
      ]);

      return { candidate_id: candidate.id };
    }),
  delete: protectedProcedure
    .input(
      z.object({
        candidate_id: z.string().min(1),
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

      if (!commissioner) throw new TRPCError({ code: 'NOT_FOUND' });

      const { data: candidate } = await ctx.supabase
        .from('candidates')
        .select()
        .eq('id', input.candidate_id)
        .eq('election_id', input.election_id)
        .is('deleted_at', null)
        .single();

      if (!candidate)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Candidate not found',
        });

      await ctx.supabase
        .from('candidates')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq('id', input.candidate_id)
        .eq('election_id', input.election_id);
    }),
  getDashboardData: protectedProcedure
    .input(
      z.object({
        election_slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // const positionsWithCandidates = await ctx.db.query.positions.findMany({
      //   where: (position, { eq, and, isNull }) =>
      //     and(
      //       eq(position.election_id, input.election_id),
      //       isNull(position.deleted_at),
      //     ),
      //   orderBy: (position, { asc }) => asc(position.order),
      //   with: {
      //     candidates: {
      //       where: (candidate, { eq, and, isNull }) =>
      //         and(
      //           eq(candidate.election_id, input.election_id),
      //           isNull(candidate.deleted_at),
      //         ),
      //       with: {
      //         partylist: true,
      //         credential: {
      //           columns: {
      //             id: true,
      //           },
      //           with: {
      //             affiliations: {
      //               columns: {
      //                 id: true,
      //                 org_name: true,
      //                 org_position: true,
      //                 start_year: true,
      //                 end_year: true,
      //               },
      //             },
      //             achievements: {
      //               columns: {
      //                 id: true,
      //                 name: true,
      //                 year: true,
      //               },
      //             },
      //             events_attended: {
      //               columns: {
      //                 id: true,
      //                 name: true,
      //                 year: true,
      //               },
      //             },
      //           },
      //         },
      //         platforms: {
      //           columns: {
      //             id: true,
      //             title: true,
      //             description: true,
      //           },
      //         },
      //       },
      //     },
      //   },
      // });

      const { data: election, error: election_error } = await ctx.supabase
        .from('elections')
        .select()
        .eq('slug', input.election_slug)
        .is('deleted_at', null)
        .single();

      if (election_error) throw new TRPCError({ code: 'NOT_FOUND' });

      const { data: commissioner } = await ctx.supabase
        .from('commissioners')
        .select()
        .eq('user_id', ctx.user.auth.id)
        .eq('election_id', election.id)
        .is('deleted_at', null)
        .single();

      if (!commissioner) throw new TRPCError({ code: 'NOT_FOUND' });

      const { data: positionsWithCandidates } = await ctx.supabase
        .from('positions')
        .select(
          `
          *,
          candidates (
            *,
            partylist:partylists!inner(*),
            credential:credentials!inner(
              *,
              achievements(*),
              affiliations(*),
              events_attended(*)
            ),
            platforms(*)
          )
          `,
        )
        .eq('election_id', election.id)
        .is('deleted_at', null)
        .is('candidates.deleted_at', null)
        .is('candidates.platforms.deleted_at', null)
        .is('candidates.credential.deleted_at', null)
        .is('candidates.credential.achievements.deleted_at', null)
        .is('candidates.credential.affiliations.deleted_at', null)
        .is('candidates.credential.events_attended.deleted_at', null)
        .order('order', { ascending: true });

      if (!positionsWithCandidates)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No positions found',
        });

      return {
        election,
        positionsWithCandidates: positionsWithCandidates.map((position) => ({
          ...position,
          candidates: position.candidates.map((candidate) => {
            let image_url: string | null = null;

            if (candidate.image_path) {
              const { data: image } = ctx.supabase.storage
                .from('candidates')
                .getPublicUrl(candidate.image_path);

              image_url = image.publicUrl;
            }

            return {
              ...candidate,
              image_url,
              partylist: candidate.partylist,
            };
          }),
        })),
      };
    }),
  getPageData: publicProcedure
    .input(
      z.object({
        election_slug: z.string().min(1),
        candidate_slug: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from('elections')
        .select(
          `
          *,
          voters: voters(*),
          commissioners: commissioners(*, user:users(*))
        `,
        )
        .eq('slug', input.election_slug)
        .is('deleted_at', null)
        .single();

      if (
        !election ||
        ((election.publicity === 'PRIVATE' || election.publicity === 'VOTER') &&
          !ctx.user)
      )
        throw new TRPCError({ code: 'NOT_FOUND' });

      const { data: candidate } = await ctx.supabase
        .from('candidates')
        .select(
          `
          *,
          partylist: partylists!inner(*),
          position: positions!inner(*),
          platforms: platforms(*),
          credential: credentials!inner(
            *,
            achievements(*),
            affiliations(*),
            events_attended(*)
          )
        `,
        )
        .eq('election_id', election.id)
        .eq('slug', input.candidate_slug)
        .is('deleted_at', null)
        .single();

      if (!candidate) throw new TRPCError({ code: 'NOT_FOUND' });

      let image_url: string | null = null;

      if (candidate.image_path) {
        const { data: image } = ctx.supabase.storage
          .from('candidates')
          .getPublicUrl(candidate.image_path);

        image_url = image.publicUrl;
      }

      return {
        election,
        candidate: {
          ...candidate,
          image_url,
          partylist: candidate.partylist,
          position: candidate.position,
          credential: {
            ...candidate.credential,
            achievements: candidate.credential.achievements,
            affiliations: candidate.credential.affiliations,
            eventsAttended: candidate.credential.events_attended,
          },
        },
        isVoterCanMessage:
          election.publicity !== 'PRIVATE' &&
          election.voters.some((voter) => voter.email === ctx.user?.db.email) &&
          !election.commissioners.some(
            (commissioner) => commissioner.user.email === ctx.user?.db.email,
          ),
      };
    }),
  editNameArrangement: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
        name_arrangement: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from('elections')
        .select('*, commissioners: commissioners(*)')
        .eq('id', input.election_id)
        .is('deleted_at', null)
        .eq('commissioners.user_id', ctx.user.auth.id)
        .is('commissioners.deleted_at', null)
        .single();

      if (!election) throw new TRPCError({ code: 'NOT_FOUND' });

      if (
        !election.commissioners.some(
          (commissioner) => commissioner.user_id === ctx.user.auth.id,
        )
      )
        throw new TRPCError({ code: 'NOT_FOUND' });

      await ctx.supabase
        .from('elections')
        .update({
          name_arrangement: input.name_arrangement,
        })
        .eq('id', input.election_id);
    }),
  getNameArrangement: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from('elections')
        .select('name_arrangement, commissioners: commissioners(user_id)')
        .eq('id', input.election_id)
        .is('deleted_at', null)
        .eq('commissioners.user_id', ctx.user.auth.id)
        .is('commissioners.deleted_at', null)
        .single();

      if (!election) throw new TRPCError({ code: 'NOT_FOUND' });

      if (
        !election.commissioners.some(
          (commissioner) => commissioner.user_id === ctx.user.auth.id,
        )
      )
        throw new TRPCError({ code: 'NOT_FOUND' });

      return election.name_arrangement;
    }),
});
