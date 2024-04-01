import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  formatName,
  isElectionEnded,
  isElectionOngoing,
  positionTemplate,
  takenSlugs,
} from "@eboto/constants";
import { sendVoteCasted } from "@eboto/email/emails/vote-casted";

import { env } from "../env.mjs";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const electionRouter = createTRPCRouter({
  getElectionPage: publicProcedure
    .input(
      z.object({
        election_slug: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select()
        .eq("slug", input.election_slug)
        .is("deleted_at", null)
        .single();

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      const { data: voter_fields } = await ctx.supabase
        .from("voter_fields")
        .select()
        .eq("election_id", election.id)
        .is("deleted_at", null);

      const { data: commissioners } = await ctx.supabase
        .from("commissioners")
        .select("*, user: users(*)")
        .eq("election_id", election.id)
        .is("deleted_at", null);

      if (!voter_fields || !commissioners)
        throw new TRPCError({ code: "NOT_FOUND" });

      const { data: positions, error: positions_error } = await ctx.supabase
        .from("positions")
        .select("*, candidates(*, partylist: partylists(*))")
        .eq("election_id", election.id)
        .is("deleted_at", null)
        .eq("candidates.election_id", election.id)
        .is("candidates.deleted_at", null)
        .order("order", { ascending: true });

      if (positions_error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: positions_error.message,
        });

      let voted = false;
      let myVoterData: {
        id: string;
        field: Record<string, string>;
      } | null = null;

      if (ctx.user) {
        const { data: voters, error: voters_error } = await ctx.supabase
          .from("voters")
          .select()
          .eq("election_id", election.id)
          .eq("email", ctx.user.db.email)
          .is("deleted_at", null);

        if (voters_error)
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: voters_error.message,
          });

        const voter = voters?.[0];

        if (voter) {
          const { data: votes, error: votes_error } = await ctx.supabase
            .from("votes")
            .select()
            .eq("voter_id", voter.id)
            .eq("election_id", election.id);

          if (votes_error)
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: votes_error.message,
            });

          voted = !!votes.length;
          myVoterData = {
            id: voter.id,
            field: voter.field as Record<string, string>,
          };
        }
      }

      let logo_url: string | null = null;

      if (election.logo_path) {
        const { data: image } = ctx.supabase.storage
          .from("elections")
          .getPublicUrl(election.logo_path);

        logo_url = image.publicUrl;
      }

      return {
        election: {
          ...election,
          voter_fields,
          commissioners,
          logo_url,
        },
        positions: positions.map((position) => ({
          ...position,
          candidates: position.candidates.map((candidate) => {
            let image_url: string | null = null;

            if (candidate.image_path) {
              const { data: image } = ctx.supabase.storage
                .from("candidates")
                .getPublicUrl(candidate.image_path);

              image_url = image.publicUrl;
            }

            return {
              ...candidate,
              image_url,
              partylist: candidate.partylist!,
            };
          }),
        })),
        isOngoing: isElectionOngoing({ election }),
        myVoterData,
        hasVoted: voted,
        isVoterCanMessage:
          election.publicity !== "PRIVATE" &&
          !!myVoterData &&
          !commissioners?.some(
            (commissioner) => commissioner.user?.email === ctx?.user?.db.email,
          ),
      };
    }),
  vote: protectedProcedure
    .input(
      z.object({
        election_id: z.string(),
        votes: z.array(
          z.object({
            position_id: z.string(),
            votes: z
              .object({
                isAbstain: z.literal(true),
              })
              .or(
                z.object({
                  isAbstain: z.literal(false),
                  candidates: z.array(z.string()),
                }),
              ),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: use transaction
      const { data: election } = await ctx.supabase
        .from("elections")
        .select()
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .single();

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      if (!isElectionOngoing({ election }))
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Election is not ongoing",
        });

      const { data: existingVotes } = await ctx.supabase
        .from("votes")
        .select()
        .eq("voter_id", ctx.user.auth.id)
        .eq("election_id", election.id)
        .single();

      if (existingVotes)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You have already voted in this election",
        });

      const { data: isVoterExists } = await ctx.supabase
        .from("voters")
        .select()
        .eq("election_id", election.id)
        .eq("email", ctx.user.db.email)
        .is("deleted_at", null)
        .single();

      if (!isVoterExists)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not a voter in this election",
        });

      await ctx.supabase.from("votes").insert(
        input.votes
          .map((vote) =>
            vote.votes.isAbstain
              ? {
                  position_id: vote.position_id,
                  voter_id: isVoterExists.id,
                  election_id: input.election_id,
                }
              : vote.votes.candidates.map((candidate_id) => ({
                  candidate_id,
                  voter_id: isVoterExists.id,
                  election_id: input.election_id,
                })),
          )
          .flat(),
      );

      const { data: positions } = await ctx.supabase
        .from("positions")
        .select()
        .eq("election_id", input.election_id)
        .is("deleted_at", null)
        .order("order", { ascending: true });

      const { data: candidates } = await ctx.supabase
        .from("candidates")
        .select()
        .eq("election_id", input.election_id)
        .is("deleted_at", null);

      if (!positions || !candidates) throw new TRPCError({ code: "NOT_FOUND" });

      await sendVoteCasted({
        email: ctx.user.db.email,
        election: {
          name: election.name,
          slug: election.slug,

          positions: input.votes.map((vote) => ({
            id: vote.position_id,
            name:
              positions.find((position) => position.id === vote.position_id)
                ?.name ?? "",
            vote: !vote.votes.isAbstain
              ? {
                  isAbstain: false,
                  candidates: vote.votes.candidates.map((candidate_id) => {
                    const candidate = candidates.find(
                      (candidate) => candidate.id === candidate_id,
                    );

                    return {
                      id: candidate?.id ?? "",
                      name: `${formatName(
                        election.name_arrangement,
                        candidate!,
                      )}`,
                    };
                  }),
                }
              : { isAbstain: true },
          })),
        },
      });
    }),
  getElectionBySlug: publicProcedure
    .input(
      z.object({
        election_slug: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select()
        .eq("slug", input.election_slug)
        .is("deleted_at", null)
        .single();

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      let logo_url: string | null = null;

      if (election.logo_path) {
        const { data: image } = ctx.supabase.storage
          .from("elections")
          .getPublicUrl(election.logo_path);

        logo_url = image.publicUrl;
      }

      return { ...election, logo_url };
    }),
  getDashboardOverviewData: protectedProcedure
    .input(
      z.object({
        election_slug: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select(
          `
          *,
          positions(*),
          partylists(*),
          voters(*, votes(*)),
          generated_election_results(*, election: elections(*, positions(*, votes(*), candidates(*, votes(*))))),
          candidates(*)
        `,
        )
        .eq("slug", input.election_slug)
        .is("deleted_at", null)
        .neq("partylists.acronym", "IND")
        .is("partylists.deleted_at", null)
        .is("voters.deleted_at", null)
        .is("candidates.deleted_at", null)
        .single();

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        ...election,
        generated_election_results: election.generated_election_results.map(
          (result) => {
            let logo_url: string | null = null;

            if (result.election?.logo_path) {
              const { data: image } = ctx.supabase.storage
                .from("partylists")
                .getPublicUrl(result.election.logo_path);

              logo_url = image.publicUrl;
            }

            return {
              ...result,
              election: {
                ...result.election!,
                logo_url,
                positions: result.election!.positions.map((position) => ({
                  ...position,
                  abstain_count: position.votes.length,
                  candidates: position.candidates.map((candidate) => ({
                    ...candidate,
                    vote_count: candidate.votes.length,
                  })),
                })),
              },
            };
          },
        ),
      };
    }),
  reportAProblem: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(1),
        description: z.string().min(1),
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.supabase.from("reported_problems").insert({
        subject: input.subject,
        description: input.description,
        election_id: input.election_id,
        user_id: ctx.user.auth.id,
      });
    }),
  getElectionVoting: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const { data: positions, error: positions_error } = await ctx.supabase
        .from("positions")
        .select("*, candidates(*, partylist: partylists(*))")
        .eq("election_id", input)
        .is("deleted_at", null)
        .order("order", { ascending: true })
        .eq("candidates.election_id", input)
        .is("candidates.deleted_at", null);

      if (positions_error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: positions_error.message,
        });

      return positions.map((position) => ({
        ...position,
        candidates: position.candidates.map((candidate) => {
          let image_url: string | null = null;

          if (candidate.image_path) {
            const { data: image } = ctx.supabase.storage
              .from("candidates")
              .getPublicUrl(candidate.image_path);

            image_url = image.publicUrl;
          }

          return {
            ...candidate,
            image_url,
            partylist: candidate.partylist!,
          };
        }),
      }));
    }),
  getElectionRealtime: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select()
        .eq("slug", input)
        .is("deleted_at", null)
        .single();

      if (!election) throw new Error("Election not found");

      // const is_free = election.variant_id === env.LEMONSQUEEZY_FREE_VARIANT_ID;
      const date = new Date();
      date.setMinutes(0);
      date.setSeconds(0);

      // const realtimeResult = await ctx.db.query.positions.findMany({
      //   where: (position, { eq, and, isNull }) =>
      //     and(
      //       eq(position.election_id, election.id),
      //       isNull(position.deleted_at),
      //     ),
      //   orderBy: (position, { asc }) => asc(position.order),
      //   with: {
      //     votes: {
      //       where: (vote, { lte }) =>
      //         is_free ? lte(vote.created_at, date) : undefined,
      //     },
      //     candidates: {
      //       where: (candidate, { eq, and, isNull }) =>
      //         and(
      //           eq(candidate.election_id, election.id),
      //           isNull(candidate.deleted_at),
      //         ),
      //       with: {
      //         votes: {
      //           where: (vote, { lte }) =>
      //             is_free ? lte(vote.created_at, date) : undefined,
      //           with: {
      //             candidate: true,
      //           },
      //         },
      //         partylist: {
      //           columns: {
      //             acronym: true,
      //           },
      //         },
      //       },
      //     },
      //   },
      // });

      const { data: realtime_result, error: realtime_result_error } =
        await ctx.supabase
          .from("positions")
          .select(
            `
          *, votes(*),
          candidates(*, votes(*, candidates(*)), partylist:partylists(*))
        `,
          )
          .eq("election_id", election.id)
          .is("deleted_at", null)
          .order("order", { ascending: true });
      // .eq("votes.election_id", election.id)
      // .lte("votes.created_at", date)
      // .eq("candidates.election_id", election.id)
      // .is("candidates.deleted_at", null)
      // .lte("candidates.votes.created_at", date)
      // .eq("candidates.votes.election_id", election.id);

      if (realtime_result_error)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: realtime_result_error.message,
        });

      return {
        positions: realtime_result.map((position) => ({
          ...position,
          votes: position.votes.length,
          candidates: position.candidates
            .sort((a, b) => b.votes.length - a.votes.length)
            .map((candidate, index) => {
              return {
                id: candidate.id,
                name:
                  !election.is_candidates_visible_in_realtime_when_ongoing &&
                  isElectionOngoing({ election }) &&
                  !isElectionEnded({ election })
                    ? `Candidate ${index + 1}`
                    : `${formatName(election.name_arrangement, candidate)} (${
                        candidate.partylist?.acronym
                      })`,
                vote: candidate.votes.length,
              };
            }),
        })),
      };
    }),
  getAllMyElections: protectedProcedure.query(async ({ ctx }) => {
    const { data: commissioners } = await ctx.supabase
      .from("commissioners")
      .select("*, election: elections(*, commissioners(*, user:users(*)))")
      .eq("user_id", ctx.user.auth.id)
      .is("deleted_at", null)
      .is("elections.commissioners.deleted_at", null)
      .is("elections.deleted_at", null)
      .order("created_at", {
        referencedTable: "elections.commissioners",
        ascending: true,
      })
      .order("created_at", { ascending: true });

    if (!commissioners) throw new TRPCError({ code: "NOT_FOUND" });

    return commissioners.map((commissioner) => {
      let logo_url: string | null = null;

      if (commissioner.election?.logo_path) {
        const { data: url } = ctx.supabase.storage
          .from("elections")
          .getPublicUrl(commissioner.election.logo_path);

        logo_url = url.publicUrl;
      }
      return {
        ...commissioner,
        election: {
          ...commissioner.election!,
          isTheCreator:
            commissioner.user_id ===
            commissioner.election?.commissioners[0]?.user_id,
          logo_url,
        },
      };
    });
  }),
  getVotersByElectionSlug: protectedProcedure
    .input(
      z.object({
        election_slug: z.string().min(1),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select("*, voter_fields(*)")
        .eq("slug", input.election_slug)
        .is("deleted_at", null)
        .single();

      if (!election)
        throw new TRPCError({
          code: "NOT_FOUND",
        });

      const { data: votersFromDb } = await ctx.supabase
        .from("voters")
        .select("*, votes:votes(*)")
        .eq("election_id", election.id)
        .is("deleted_at", null)
        .limit(1, { referencedTable: "votes" });

      if (!votersFromDb) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        election,
        voters: votersFromDb.map((voter) => ({
          id: voter.id,
          email: voter.email,
          created_at: voter.created_at,
          field: voter.field,
          has_voted: !!voter.votes.length,
        })),
      };
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1).trim().toLowerCase(),
        date: z.custom<[string, string]>(),
        template: z.string(),
        voting_hours: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (takenSlugs.includes(input.slug)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Election slug is already exists",
        });
      }

      if (!Array.isArray(input.date) || input.date.length !== 2) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Date must be an array of 2",
        });
      }

      const { data: election_plus, error: election_plus_error } =
        await ctx.supabase
          .from("elections_plus")
          .select()
          .eq("user_id", ctx.user.auth.id)
          .is("redeemed_at", null)
          .single();

      if (election_plus_error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: election_plus_error.message,
        });

      if (!election_plus)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You don't have the permission to create an election",
        });

      const { data: election } = await ctx.supabase
        .from("elections")
        .select("id")
        .eq("slug", input.slug)
        .is("deleted_at", null)
        .single();

      if (election) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Election slug is already exists",
        });
      }

      // TODO: use transaction
      const { data: create_election, error: create_election_error } =
        await ctx.supabase
          .from("elections")
          .insert({
            name: input.name,
            slug: input.slug,
            start_date: input.date[0],
            end_date: input.date[1],
            voting_hour_start: input.voting_hours[0],
            voting_hour_end: input.voting_hours[1],
            variant_id: env.LEMONSQUEEZY_FREE_VARIANT_ID,
          })
          .select("id")
          .single();

      if (create_election_error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: create_election_error.message,
        });

      const { error: commissioners_error } = await ctx.supabase
        .from("commissioners")
        .insert({
          election_id: create_election.id,
          user_id: ctx.user.auth.id,
        });

      if (commissioners_error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: commissioners_error.message,
        });

      const { error: partylist_error } = await ctx.supabase
        .from("partylists")
        .insert({
          name: "Independent",
          acronym: "IND",
          election_id: create_election.id,
        });

      if (partylist_error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: partylist_error.message,
        });

      const positionsInTemplate =
        positionTemplate
          .find((template) =>
            template.organizations.find(
              (organization) => organization.id === input.template,
            ),
          )
          ?.organizations.find(
            (organization) => organization.id === input.template,
          )
          ?.positions.map((position, i) => ({
            name: position,
            order: i,
            election_id: create_election.id,
          })) ?? [];
      if (input.template !== "none" && positionsInTemplate.length > 0) {
        const { error: positions_error } = await ctx.supabase
          .from("positions")
          .insert(positionsInTemplate);

        if (positions_error)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: positions_error.message,
          });
      }

      await ctx.supabase
        .from("elections_plus")
        .update({ redeemed_at: new Date().toISOString() })
        .eq("id", election_plus.id);
    }),
  edit: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().nullable(),
        oldSlug: z.string().trim().toLowerCase(),
        newSlug: z.string().min(1).trim().toLowerCase(),
        date: z.custom<[string, string]>(),
        publicity: z.enum(["PUBLIC", "PRIVATE", "VOTER"] as const),
        is_candidates_visible_in_realtime_when_ongoing: z.boolean(),
        // voter_domain: z.string().nullable(),
        voting_hours: z.custom<[number, number]>(),
        logo: z
          .object({
            name: z.string().min(1),
            type: z.string().min(1),
            base64: z.string().min(1),
          })
          .nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.newSlug !== input.oldSlug) {
        if (takenSlugs.includes(input.newSlug)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Election slug is already exists",
          });
        }

        // if (input.voter_domain) {
        //   if (input.voter_domain === "gmail.com")
        //     throw new TRPCError({
        //       code: "BAD_REQUEST",
        //       message: "Gmail is not allowed",
        //     });

        //   if (input.voter_domain.includes("@"))
        //     throw new TRPCError({
        //       code: "BAD_REQUEST",
        //       message: "Please enter only the domain name",
        //     });
        // }

        const { data: election } = await ctx.supabase
          .from("elections")
          .select()
          .eq("slug", input.newSlug)
          .is("deleted_at", null)
          .single();

        if (election)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Election slug is already exists",
          });
      }

      // TODO: use transaction
      const { data: isElectionCommissionerExists } = await ctx.supabase
        .from("elections")
        .select("*, commissioners(*)")
        .eq("id", input.id)
        .is("deleted_at", null)
        .eq("commissioners.user_id", ctx.user.auth.id)
        .is("commissioners.deleted_at", null)
        .single();

      if (
        !isElectionCommissionerExists ||
        (isElectionCommissionerExists &&
          isElectionCommissionerExists.commissioners.length === 0)
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
      }

      if (
        isElectionCommissionerExists.logo_path &&
        (input.logo === null || input.logo)
      ) {
        await ctx.supabase.storage
          .from("elections")
          .remove([isElectionCommissionerExists.logo_path]);
      }

      const isElectionDatesDisabled =
        isElectionOngoing({ election: isElectionCommissionerExists }) ||
        isElectionEnded({ election: isElectionCommissionerExists });

      await ctx.supabase
        .from("elections")
        .update({
          name: input.name,
          slug: input.newSlug,
          description: input.description,
          publicity: input.publicity,
          start_date: !isElectionDatesDisabled ? input.date[0] : undefined,
          end_date: !isElectionDatesDisabled ? input.date[1] : undefined,
          // voter_domain: !isElectionDatesDisabled ? input.voter_domain : undefined,
          is_candidates_visible_in_realtime_when_ongoing:
            input.is_candidates_visible_in_realtime_when_ongoing,
          voting_hour_start: !isElectionDatesDisabled
            ? input.voting_hours[0]
            : undefined,
          voting_hour_end: !isElectionDatesDisabled
            ? input.voting_hours[1]
            : undefined,
          logo_path: input.logo
            ? await fetch(input.logo.base64)
                .then((res) => res.blob())
                .then(async (blob) => {
                  const { data } = await ctx.supabase.storage
                    .from("elections")
                    .upload(`${input.id}/logo/${Date.now()}`, blob);

                  return data?.path;
                })
            : input.logo,
        })
        .eq("id", input.id);
    }),
  delete: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: use transaction
      await ctx.supabase
        .from("commissioners")
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq("election_id", input.election_id);
      await ctx.supabase
        .from("elections")
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq("id", input.election_id);
    }),
  getVoterFieldsStats: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select("*, voter_fields(*)")
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .single();

      const { data: voters } = await ctx.supabase
        .from("voters")
        .select("*, votes(*)")
        .eq("election_id", input.election_id)
        .is("deleted_at", null);

      if (!election || !voters) throw new TRPCError({ code: "NOT_FOUND" });

      const fields = [];

      for (const field of election.voter_fields) {
        const fieldOptions = [] as {
          name: string;
          vote_count: number;
        }[];

        for (const voter of voters) {
          const optionName =
            (voter.field as Record<string, string> | null)?.[field.id] ?? "";
          const voteCount = voter.votes.length > 0 ? 1 : 0;

          const existingOption = fieldOptions.find(
            (option) => option.name === optionName,
          );

          if (existingOption) {
            existingOption.vote_count += voteCount;
          } else {
            fieldOptions.push({
              name: optionName,
              vote_count: voteCount,
            });
          }
        }

        fields.push({
          id: field.id,
          name: field.name,
          created_at: field.created_at,
          options: fieldOptions,
        });
      }
      return fields;
    }),
  getVoterFieldsStatsInRealtime: publicProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select("*, voter_fields(*)")
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .single();

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      const date = new Date();
      date.setMinutes(0);
      date.setSeconds(0);

      // const voters = await ctx.db.query.voters.findMany({
      //   where: (voters, { eq }) => eq(voters.election_id, input.election_id),
      //   with: {
      //     votes: {
      //       where: (vote, { lte }) =>
      //         election.variant_id === env.LEMONSQUEEZY_FREE_VARIANT_ID
      //           ? lte(vote.created_at, date)
      //           : undefined,
      //     },
      //   },
      // });

      const { data: voters } = await ctx.supabase
        .from("voters")
        .select("*, votes(*)")
        .eq("election_id", input.election_id)
        .is("deleted_at", null);

      if (!voters) throw new TRPCError({ code: "NOT_FOUND" });

      const fields = [];

      for (const field of election.voter_fields) {
        const fieldOptions = [] as {
          name: string;
          vote_count: number;
        }[];

        for (const voter of voters) {
          const optionName =
            (voter.field as Record<string, string> | null)?.[field.id] ?? "";
          const voteCount = voter.votes.length > 0 ? 1 : 0;

          const existingOption = fieldOptions.find(
            (option) => option.name === optionName,
          );

          if (existingOption) {
            existingOption.vote_count += voteCount;
          } else {
            fieldOptions.push({
              name: optionName,
              vote_count: voteCount,
            });
          }
        }

        fields.push({
          id: field.id,
          name: field.name,
          created_at: field.created_at,
          options: fieldOptions,
        });
      }
      return fields;
    }),
  getElectionProgress: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select(
          `
          *,
          voters(*),
          partylists(*),
          positions(*),
          candidates(*)
        `,
        )
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .is("voters.deleted_at", null)
        .limit(1, { referencedTable: "voters" })
        .is("partylists.deleted_at", null)
        .limit(2, { referencedTable: "partylists" })
        .is("positions.deleted_at", null)
        .limit(1, { referencedTable: "positions" })
        .is("candidates.deleted_at", null)
        .limit(1, { referencedTable: "candidates" })
        .limit(1)
        .single();

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      if (isElectionEnded({ election })) return 7;

      if (isElectionOngoing({ election })) return 6;

      if (election.voters.length > 0) return 5;

      if (election.candidates.length > 0) return 4;

      if (election.positions.length > 0) return 3;

      if (election.partylists.length > 1) return 2;

      return 1;
    }),
  getAllPublicElections: publicProcedure.query(async ({ ctx }) => {
    const { data: elections } = await ctx.supabase
      .from("elections")
      .select()
      .eq("publicity", "PUBLIC")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (!elections) throw new TRPCError({ code: "NOT_FOUND" });

    return elections;
  }),
  getAllCommissionerByElectionSlug: protectedProcedure
    .input(z.object({ election_slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select(
          `
          *,
          commissioners(*, user:users(*))
        `,
        )
        .eq("slug", input.election_slug)
        .is("deleted_at", null)
        .is("commissioners.deleted_at", null)
        .order("created_at", {
          referencedTable: "commissioners",
          ascending: true,
        })
        .single();

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      return election.commissioners.map((commissioner) => {
        let image_url: string | null = null;

        if (commissioner.user?.image_path) {
          const { data: image } = ctx.supabase.storage
            .from("users")
            .getPublicUrl(commissioner.user.image_path);

          image_url = image.publicUrl;
        }

        return {
          ...commissioner,
          user: {
            ...commissioner.user,
            isTheCreator:
              commissioner.user?.id === election.commissioners[0]?.user_id,
            isMe: commissioner.user?.id === ctx.user.auth.id,
            image_url,
          },
        };
      });
    }),
  addCommissioner: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.db.email === input.email)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot add yourself as a commissioner",
        });

      const { data: election } = await ctx.supabase
        .from("elections")
        .select("*, commissioners(*, user:users(*))")
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .is("commissioners.deleted_at", null)
        .single();

      if (!election)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election not found",
        });

      const { data: user } = await ctx.supabase
        .from("users")
        .select()
        .eq("email", input.email)
        .single();

      if (!user)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      const { data: isCommissionerExists } = await ctx.supabase
        .from("commissioners")
        .select()
        .eq("election_id", election.id)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .single();

      if (isCommissionerExists)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Commissioner already exists",
        });

      await ctx.supabase.from("commissioners").insert({
        election_id: election.id,
        user_id: user.id,
      });
    }),
  deleteCommissioner: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
        commissioner_id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select("*, commissioners(*, user:users(*))")
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .is("commissioners.deleted_at", null)
        .order("created_at", {
          referencedTable: "commissioners",
          ascending: true,
        })
        .single();

      if (!election)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election not found",
        });

      if (election.commissioners[0]?.user_id === input.commissioner_id)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove the creator of the election",
        });

      if (election.commissioners.length === 1)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove the last commissioner of the election",
        });

      const { data: commissioner } = await ctx.supabase
        .from("commissioners")
        .select()
        .eq("id", input.commissioner_id)
        .eq("election_id", input.election_id)
        .is("deleted_at", null)
        .single();

      if (!commissioner)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Commissioner not found",
        });

      await ctx.supabase
        .from("commissioners")
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq("id", input.commissioner_id)
        .eq("election_id", input.election_id)
        .is("deleted_at", null);
    }),
  getMyElectionAsCommissioner: protectedProcedure.query(async ({ ctx }) => {
    const { data: electionsThatICanManage } = await ctx.supabase
      .from("elections")
      .select("*, commissioners(*)")
      .is("deleted_at", null)
      .eq("commissioners.user_id", ctx.user.auth.id)
      .is("commissioners.deleted_at", null);

    if (!electionsThatICanManage) throw new TRPCError({ code: "NOT_FOUND" });

    const { data: electionsAsCommissioner } = electionsThatICanManage.length
      ? await ctx.supabase
          .from("commissioners")
          .select("*, election: elections(*)")
          .eq("user_id", ctx.user.auth.id)
          .is("deleted_at", null)
          .in(
            "election_id",
            electionsThatICanManage.map((election) => election.id),
          )
      : await ctx.supabase
          .from("commissioners")
          .select("*, election: elections(*)")
          .eq("user_id", ctx.user.auth.id)
          .is("deleted_at", null);

    if (!electionsAsCommissioner) throw new TRPCError({ code: "NOT_FOUND" });

    return electionsAsCommissioner
      .map((commissioner) => {
        let logo_url: string | null = null;

        if (commissioner.election?.logo_path) {
          const { data: url } = ctx.supabase.storage
            .from("elections")
            .getPublicUrl(commissioner.election?.logo_path);

          logo_url = url.publicUrl;
        }
        return {
          ...commissioner.election!,
          is_free:
            commissioner.election?.variant_id ===
            env.LEMONSQUEEZY_FREE_VARIANT_ID,
          logo_url,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }),
  getMyElectionAsVoter: protectedProcedure.query(async ({ ctx }) => {
    const { data: electionsThatICanVoteIn } = await ctx.supabase
      .from("elections")
      .select("*, voters(*)")
      .neq("publicity", "PRIVATE")
      .is("deleted_at", null)
      .eq("voters.email", ctx.user.db.email)
      .is("voters.deleted_at", null)
      .limit(1, { referencedTable: "voters" });

    if (!electionsThatICanVoteIn) throw new TRPCError({ code: "NOT_FOUND" });

    const elections = electionsThatICanVoteIn.filter((election) =>
      isElectionOngoing({ election, withoutHours: true }),
    );

    // const electionsAsVoter = await ctx.db.query.voters.findMany({
    //   where: (voters, { eq, ne, and, inArray, isNull }) =>
    //     and(
    //       isNull(voters.deleted_at),
    //       eq(voters.email, ctx.user.db.email),
    //       elections.length
    //         ? inArray(
    //             voters.election_id,
    //             elections.map((election) => election.id),
    //           )
    //         : ne(voters.email, ctx.user.db.email),
    //     ),
    //   with: {
    //     election: {
    //       with: {
    //         votes: {
    //           where: (votes, { inArray }) =>
    //             electionsThatICanVoteIn.flatMap((election) =>
    //               election.voters.map((voter) => voter.id),
    //             ).length > 0
    //               ? inArray(
    //                   votes.voter_id,
    //                   electionsThatICanVoteIn.flatMap((election) =>
    //                     election.voters.map((voter) => voter.id),
    //                   ),
    //                 )
    //               : undefined,
    //           limit: 1,
    //         },
    //       },
    //     },
    //   },
    // });

    // TODO: not sure if this is the correct way
    const { data: electionsAsVoter } = elections.length
      ? await ctx.supabase
          .from("voters")
          .select("*, election: elections(*, votes(*))")
          .eq("email", ctx.user.db.email)
          .is("deleted_at", null)
          .in(
            "election_id",
            elections.map((election) => election.id),
          )
      : await ctx.supabase
          .from("voters")
          .select("*, election: elections(*, votes(*))")
          .eq("email", ctx.user.db.email)
          .is("deleted_at", null);

    if (!electionsAsVoter) throw new TRPCError({ code: "NOT_FOUND" });

    return electionsAsVoter
      .map((voter) => voter.election!)
      .map((election) => {
        let logo_url: string | null = null;

        if (election.logo_path) {
          const { data: url } = ctx.supabase.storage
            .from("elections")
            .getPublicUrl(election.logo_path);

          logo_url = url.publicUrl;
        }
        return { ...election, logo_url, is_free: true };
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }),
  messageCommissioner: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
        title: z.string().min(1),
        message: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select("*, voters(*), commissioners(*, user:users(*))")
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .neq("publicity", "PRIVATE")
        .eq("voters.email", ctx.user.db.email)
        .is("voters.deleted_at", null)
        .is("commissioners.deleted_at", null)
        .single();

      if (!election)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election not found",
        });

      if (election.variant_id === env.LEMONSQUEEZY_FREE_VARIANT_ID)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You cannot send a message in a free election",
        });

      if (!election.commissioners.length)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No commissioners found",
        });

      if (election.publicity === "PUBLIC" && !election.voters.length)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });

      if (
        election.commissioners.find(
          (commissioner) => commissioner.user?.email === ctx.user.db.email,
        )
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot send a message to yourself",
        });

      // TODO: use transaction
      const { data: room, error: room_error } = await ctx.supabase
        .from("commissioners_voters_rooms")
        .insert({
          election_id: input.election_id,
          name: input.title,
        })
        .select("id")
        .single();

      if (room_error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: room_error.message,
        });

      await ctx.supabase.from("commissioners_voters_messages").insert({
        message: input.message,
        room_id: room.id,
        user_id: ctx.user.auth.id,
      });
    }),
  getAllMyMessages: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select()
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .neq("publicity", "PRIVATE")
        .single();

      if (!election)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election not found",
        });

      const { data: rooms } = await ctx.supabase
        .from("commissioners_voters_rooms")
        .select("*, messages: commissioners_voters_messages(*, user:users(*))")
        .eq("election_id", election.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .order("created_at", {
          ascending: false,
          referencedTable: "commissioners_voters_messages",
        });

      if (!rooms) throw new TRPCError({ code: "NOT_FOUND" });

      return rooms.map((room) => ({
        ...room,
        messages: room.messages.map((message) => {
          let image_url: string | null = null;

          if (message.user?.image_path) {
            const { data: image } = ctx.supabase.storage
              .from("users")
              .getPublicUrl(message.user.image_path);

            image_url = image.publicUrl;
          }

          return {
            ...message,
            user: {
              ...message.user,
              image_url,
            },
          };
        }),
      }));
    }),
  messageAdmin: protectedProcedure
    .input(
      z.object({
        election_slug: z.string().min(1),
        title: z.string().min(1),
        message: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select("*, commissioners(*, user:users(*))")
        .eq("slug", input.election_slug)
        .is("deleted_at", null)
        .is("commissioners.deleted_at", null)
        .single();

      if (!election)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election not found",
        });

      if (!election.commissioners.length)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No commissioners found",
        });

      // TODO: use transaction
      const { data: room, error: room_error } = await ctx.supabase
        .from("admin_commissioners_rooms")
        .insert({
          election_id: election.id,
          name: input.title,
        })
        .select("id")
        .single();

      if (room_error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: room_error.message,
        });

      await ctx.supabase.from("admin_commissioners_messages").insert({
        message: input.message,
        room_id: room.id,
        user_id: ctx.user.auth.id,
      });
    }),
  getAllCommissionerVoterRooms: protectedProcedure
    .input(
      z.object({
        election_slug: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select("*, commissioners(*, user:users(*))")
        .eq("slug", input.election_slug)
        .is("deleted_at", null)
        .is("commissioners.deleted_at", null)
        .single();

      if (!election)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election not found",
        });

      if (
        !election.commissioners.find(
          (commissioner) => commissioner.user?.email === ctx.user.db.email,
        )
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });

      const { data: rooms } = await ctx.supabase
        .from("commissioners_voters_rooms")
        .select("*, messages: commissioners_voters_messages(*, user:users(*))")
        .eq("election_id", election.id)
        .is("deleted_at", null)
        .order("created_at", {
          referencedTable: "commissioners_voters_messages",
          ascending: false,
        })
        .limit(1, { referencedTable: "commissioners_voters_messages" })
        .order("created_at", { ascending: false });

      if (!rooms) throw new TRPCError({ code: "NOT_FOUND" });

      return rooms.map((room) => ({
        ...room,
        messages: room.messages.map((message) => {
          let image_url: string | null = null;

          if (message.user?.image_path) {
            const { data: image } = ctx.supabase.storage
              .from("users")
              .getPublicUrl(message.user.image_path);

            image_url = image.publicUrl;
          }

          return {
            ...message,
            user: {
              ...message.user,
              image_url,
            },
          };
        }),
      }));
    }),
  getAllAdminCommissionerRooms: protectedProcedure
    .input(
      z.object({
        election_slug: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select("*, commissioners(*, user:users(*))")
        .eq("slug", input.election_slug)
        .is("deleted_at", null)
        .is("commissioners.deleted_at", null)
        .single();

      if (!election)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election not found",
        });

      if (
        !election.commissioners.find(
          (commissioner) => commissioner.user?.email === ctx.user.db.email,
        )
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });

      const { data: rooms, error: rooms_error } = await ctx.supabase
        .from("admin_commissioners_rooms")
        .select("*, messages: admin_commissioners_messages(*, user: users(*))")
        .eq("election_id", election.id)
        .is("deleted_at", null)
        .order("created_at", {
          referencedTable: "admin_commissioners_messages",
          ascending: false,
        })
        .order("created_at", { ascending: false });

      if (rooms_error)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: rooms_error.message,
        });

      if (!rooms) throw new TRPCError({ code: "NOT_FOUND" });

      return rooms.map((room) => ({
        ...room,
        messages: room.messages.map((message) => {
          let image_url: string | null = null;

          if (message.user?.image_path) {
            const { data: image } = ctx.supabase.storage
              .from("users")
              .getPublicUrl(message.user.image_path);

            image_url = image.publicUrl;
          }

          return {
            ...message,
            user: {
              ...message.user,
              image_url,
            },
          };
        }),
      }));
    }),
  getMessagesAsVoter: protectedProcedure
    .input(
      z.object({
        room_id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: commissionerVoterRoom } = await ctx.supabase
        .from("commissioners_voters_rooms")
        .select("*, messages:commissioners_voters_messages(*, user:users(*))")
        .eq("id", input.room_id)
        .is("deleted_at", null)
        .order("created_at", {
          ascending: true,
          referencedTable: "commissioners_voters_messages",
        })
        .single();

      if (!commissionerVoterRoom)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });

      return commissionerVoterRoom.messages.map((message) => ({
        ...message,
        user: {
          ...message.user,
          isMe: message.user?.id === ctx.user.auth.id,
        },
      }));
    }),
  getMessagesAsComissioner: protectedProcedure
    .input(
      z.object({
        type: z.enum(["admin", "voters"]),
        room_id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.type === "voters") {
        const { data: commissionerVoterRoom } = await ctx.supabase
          .from("commissioners_voters_rooms")
          .select("*, messages:commissioners_voters_messages(*, user:users(*))")
          .eq("id", input.room_id)
          .is("deleted_at", null)
          .order("created_at", {
            ascending: true,
            referencedTable: "commissioners_voters_messages",
          })
          .order("created_at", { ascending: true })
          .single();

        if (!commissionerVoterRoom)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Room not found",
          });

        return commissionerVoterRoom.messages.map((message) => ({
          ...message,
          user: {
            ...message.user,
            isMe: message.user?.id === ctx.user.auth.id,
          },
        }));
      } else {
        const { data: adminCommissionerRoom } = await ctx.supabase
          .from("admin_commissioners_rooms")
          .select("*, messages:admin_commissioners_messages(*, user:users(*))")
          .eq("id", input.room_id)
          .is("deleted_at", null)
          .order("created_at", {
            ascending: true,
            referencedTable: "admin_commissioners_messages",
          })
          .order("created_at", { ascending: true })
          .single();

        if (!adminCommissionerRoom)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Room not found",
          });

        return adminCommissionerRoom.messages.map((message) => ({
          ...message,
          user: {
            ...message.user,
            isMe: message.user?.id === ctx.user.auth.id,
          },
        }));
      }
    }),
  sendMessageAsVoter: protectedProcedure
    .input(
      z.object({
        room_id: z.string().min(1),
        message: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data: commissionerVoterRoom } = await ctx.supabase
        .from("commissioners_voters_rooms")
        .select()
        .eq("id", input.room_id)
        .is("deleted_at", null)
        .single();

      if (!commissionerVoterRoom)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room not found",
        });

      await ctx.supabase.from("commissioners_voters_messages").insert({
        message: input.message,
        room_id: commissionerVoterRoom.id,
        user_id: ctx.user.auth.id,
      });
    }),
  sendMessageAsCommissioner: protectedProcedure
    .input(
      z.object({
        type: z.enum(["admin", "voters"]),
        room_id: z.string().min(1),
        message: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.type === "voters") {
        const { data: commissionerVoterRoom } = await ctx.supabase
          .from("commissioners_voters_rooms")
          .select()
          .eq("id", input.room_id)
          .is("deleted_at", null)
          .single();

        if (!commissionerVoterRoom)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Room not found",
          });

        await ctx.supabase.from("commissioners_voters_messages").insert({
          message: input.message,
          room_id: commissionerVoterRoom.id,
          user_id: ctx.user.auth.id,
        });
      } else {
        const { data: adminCommissionerRoom } = await ctx.supabase
          .from("admin_commissioners_rooms")
          .select()
          .eq("id", input.room_id)
          .is("deleted_at", null)
          .single();

        if (!adminCommissionerRoom)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Room not found",
          });

        await ctx.supabase.from("admin_commissioners_messages").insert({
          message: input.message,
          room_id: adminCommissionerRoom.id,
          user_id: ctx.user.auth.id,
        });
      }
    }),
  getElectionsPlusLeft: protectedProcedure.query(async ({ ctx }) => {
    const { data: elections_plus } = await ctx.supabase
      .from("elections_plus")
      .select()
      .eq("user_id", ctx.user.auth.id)
      .is("redeemed_at", null);

    if (!elections_plus) throw new TRPCError({ code: "NOT_FOUND" });

    return elections_plus.length;
  }),
});
