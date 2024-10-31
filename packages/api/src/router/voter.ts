import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { isElectionEnded, isElectionOngoing } from "@eboto/constants";
import { LS_DATA_DEV, LS_DATA_PROD } from "@eboto/supabase/seed";

import { env } from "../env";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const voterRouter = createTRPCRouter({
  createSingle: protectedProcedure
    .input(
      z.object({
        email: z.string().min(1),
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data: isElectionExists } = await ctx.supabase
        .from("elections")
        .select("*, commissioners(*), variant: variants(*)")
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .eq("commissioners.user_id", ctx.user.auth.id)
        .single();

      if (!isElectionExists)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election does not exists",
        });

      if (isElectionExists.commissioners.length === 0)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });

      const { data: voters_length, error: voters_length_error } =
        await ctx.supabase
          .from("voters")
          .select("*")
          .eq("election_id", input.election_id)
          .is("deleted_at", null);

      if (voters_length_error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: voters_length_error.message,
        });

      const data =
        process.env.NODE_ENV === "development" ? LS_DATA_DEV : LS_DATA_PROD;

      const variant = data.products
        .flatMap((product) => product.variants)
        .find((variant) => variant.id === isElectionExists.variant_id);

      if (!variant) throw new TRPCError({ code: "NOT_FOUND" });

      if (voters_length.length >= variant.voters)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Maximum number of voters reached. Maximum no. of voters is " +
            variant.voters +
            ".",
        });

      const { data: voters, error: voters_error } = await ctx.supabase
        .from("voters")
        .select("*")
        .eq("election_id", input.election_id)
        .is("deleted_at", null);

      if (voters_error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: voters_error.message,
        });

      if (voters.find((voter) => voter.email === input.email))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email is already a voter",
        });

      if (isElectionExists.no_of_voters) {
        if (voters.length + 1 >= isElectionExists.no_of_voters)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Maximum number of voters reached. Maximum no. of voters is " +
              isElectionExists.no_of_voters +
              ".",
          });
      } else {
        const is_free =
          env.LEMONSQUEEZY_FREE_VARIANT_ID === isElectionExists.variant_id;

        if (is_free && voters.length + 1 >= 500)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Maximum number of voters reached. Maximum no. of voters is 500.",
          });

        if (!is_free && isElectionExists.variant) {
          const no_of_voters = parseInt(
            (/[\d,]+/.exec(isElectionExists.variant.name)?.[0] ?? "").replace(
              ",",
              "",
            ),
          );

          if (voters.length + 1 >= no_of_voters)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Maximum number of voters reached. Maximum no. of voters is " +
                no_of_voters +
                ".",
            });
        }
      }

      await ctx.supabase.from("voters").insert({
        email: input.email,
        election_id: isElectionExists.id,
      });
    }),
  getAllVoterField: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { data: isElectionExists } = await ctx.supabase
        .from("elections")
        .select("*")
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .single();

      if (!isElectionExists)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election does not exists",
        });

      const { data: isElectionCommissionerExists } = await ctx.supabase
        .from("commissioners")
        .select("*")
        .eq("election_id", input.election_id)
        .eq("user_id", ctx.user.auth.id)
        .is("deleted_at", null)
        .single();

      if (!isElectionCommissionerExists)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });

      const { data: voter_fields, error: voter_fields_error } =
        await ctx.supabase
          .from("voter_fields")
          .select("*")
          .eq("election_id", input.election_id)
          .is("deleted_at", null);

      if (voter_fields_error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
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
            type: z.enum(["fromDb", "fromInput"]),
          }),
        ),
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select("*")
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .single();

      if (!election)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election does not exists",
        });

      if (isElectionOngoing({ election }))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Election is ongoing",
        });

      if (isElectionEnded({ election }))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Election is ended",
        });

      if (
        input.fields.some((field) => field.name.toLowerCase().includes("email"))
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Field cannot be added",
        });

      await ctx.supabase
        .from("voter_fields")
        .delete()
        .eq("election_id", input.election_id);

      await ctx.supabase.from("voter_fields").insert(
        input.fields.map((field) => ({
          name: field.name,
          election_id: input.election_id,
        })),
      );
    }),
  deleteSingleVoterField: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
        field_id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.supabase
        .from("voter_fields")
        .delete()
        .eq("id", input.field_id)
        .eq("election_id", input.election_id);
    }),
  edit: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        email: z.string().min(1),
        election_id: z.string().min(1),
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
        .from("elections")
        .select("*")
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .single();

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      const { data: commissioner } = await ctx.supabase
        .from("commissioners")
        .select("*")
        .eq("user_id", ctx.user.auth.id)
        .eq("election_id", election.id)
        .is("deleted_at", null)
        .single();

      if (!commissioner) throw new TRPCError({ code: "UNAUTHORIZED" });

      const { data: isElectionCommissionerExists } = await ctx.supabase
        .from("commissioners")
        .select("*")
        .eq("election_id", input.election_id)
        .eq("user_id", ctx.user.auth.id)
        .is("deleted_at", null)
        .single();

      if (!isElectionCommissionerExists)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });

      await ctx.supabase
        .from("voters")
        .update({
          email: input.email,
          field: input.voter_fields.reduce(
            (acc, field) => {
              acc[field.id] = field.value ?? "";
              return acc;
            },
            {} as Record<string, string>,
          ),
        })
        .eq("id", input.id);

      return { type: "voter" };
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        election_id: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data: isElectionExists } = await ctx.supabase
        .from("elections")
        .select("*")
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .single();

      if (!isElectionExists)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election does not exists",
        });

      const { data: isElectionCommissionerExists } = await ctx.supabase
        .from("commissioners")
        .select("*")
        .eq("election_id", input.election_id)
        .eq("user_id", ctx.user.auth.id)
        .is("deleted_at", null)
        .single();

      if (!isElectionCommissionerExists)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });

      const { data: voter } = await ctx.supabase
        .from("voters")
        .select("*")
        .eq("id", input.id)
        .eq("election_id", input.election_id)
        .is("deleted_at", null)
        .single();

      if (!voter)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Voter not found",
        });

      await ctx.supabase
        .from("voters")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", input.id)
        .eq("election_id", input.election_id);
    }),
  deleteBulk: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
        voters: z.array(
          z.object({
            id: z.string().min(1),
            email: z.string().min(1),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select("*")
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .single();

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      const { data: commissioner } = await ctx.supabase
        .from("commissioners")
        .select("*")
        .eq("user_id", ctx.user.auth.id)
        .eq("election_id", election.id)
        .is("deleted_at", null)
        .single();

      if (!commissioner) throw new TRPCError({ code: "UNAUTHORIZED" });

      await ctx.supabase
        .from("voters")
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq("election_id", input.election_id)
        .in(
          "id",
          input.voters.map((voter) => voter.id),
        );

      return {
        count: input.voters.map((voter) => voter.id).length,
      };
    }),
  uploadBulk: protectedProcedure
    .input(
      z.object({
        election_id: z.string().min(1),
        voters: z.array(
          z.object({
            email: z.string().min(1),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data: election } = await ctx.supabase
        .from("elections")
        .select("*")
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .single();

      if (!election) throw new TRPCError({ code: "NOT_FOUND" });

      const { data: commissioner } = await ctx.supabase
        .from("commissioners")
        .select("*")
        .eq("user_id", ctx.user.auth.id)
        .eq("election_id", election.id)
        .is("deleted_at", null)
        .single();

      if (!commissioner) throw new TRPCError({ code: "UNAUTHORIZED" });

      // await ctx.db.transaction(async (db) => {
      // TODO: use transaction
      const { data: isElectionExists } = await ctx.supabase
        .from("elections")
        .select("*, commissioners(*), variant: variants(*)")
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .eq("commissioners.user_id", ctx.user.auth.id)
        .single();

      if (!isElectionExists) throw new Error("Election does not exists");

      if (isElectionExists.commissioners.length === 0)
        throw new Error("Unauthorized");

      const { data: voters, error: voters_length_error } = await ctx.supabase
        .from("voters")
        .select("*")
        .eq("election_id", input.election_id)
        .is("deleted_at", null);

      if (voters_length_error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: voters_length_error.message,
        });

      const data =
        process.env.NODE_ENV === "development" ? LS_DATA_DEV : LS_DATA_PROD;

      const variant = data.products
        .flatMap((product) => product.variants)
        .find((variant) => variant.id === isElectionExists.variant_id);

      if (!variant) throw new TRPCError({ code: "NOT_FOUND" });

      if (voters.length >= variant.voters)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Maximum number of voters reached. Maximum no. of voters is " +
            variant.voters +
            ".",
        });

      const { data: votersFromDb, error: votersFromDbError } =
        await ctx.supabase
          .from("voters")
          .select("*")
          .eq("election_id", input.election_id)
          .is("deleted_at", null);

      if (votersFromDbError)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: votersFromDbError.message,
        });

      const uniqueVoters = input.voters.filter(
        (voter) =>
          !votersFromDb.some(
            (voterFromDb) => voterFromDb.email === voter.email,
          ),
      );

      if (isElectionExists.no_of_voters) {
        if (
          voters.length + uniqueVoters.length >=
          isElectionExists.no_of_voters
        )
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Maximum number of voters reached. Maximum no. of voters is " +
              isElectionExists.no_of_voters +
              ".",
          });
      } else {
        const is_free =
          env.LEMONSQUEEZY_FREE_VARIANT_ID === isElectionExists.variant_id;

        if (is_free && voters.length + uniqueVoters.length >= 500)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Maximum number of voters reached. Maximum no. of voters is 500.",
          });

        if (!is_free && isElectionExists.variant) {
          const no_of_voters = parseInt(
            (/[\d,]+/.exec(isElectionExists.variant.name)?.[0] ?? "").replace(
              ",",
              "",
            ),
          );

          if (voters.length + uniqueVoters.length >= no_of_voters)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Maximum number of voters reached. Maximum no. of voters is " +
                no_of_voters +
                ".",
            });
        }
      }

      const { data: uploaded_voters, error: uploaded_voters_error } =
        await ctx.supabase
          .from("voters")
          .insert(
            uniqueVoters.map((voter) => ({
              election_id: isElectionExists.id,
              email: voter.email,
            })),
          )
          .select();

      if (uploaded_voters_error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
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
        election_id: z.string().min(1),
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
      const { data: isElectionExists } = await ctx.supabase
        .from("elections")
        .select("*")
        .eq("id", input.election_id)
        .is("deleted_at", null)
        .single();

      if (!isElectionExists)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Election does not exists",
        });

      if (isElectionExists.publicity === "PRIVATE")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });

      const { data: isVoterExists } = await ctx.supabase
        .from("voters")
        .select("*")
        .eq("id", input.voter_id)
        .eq("election_id", input.election_id)
        .is("deleted_at", null)
        .single();

      if (!isVoterExists)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Voter does not exists",
        });

      await ctx.supabase
        .from("voters")
        .update({
          field: input.fields.reduce(
            (acc, field) => {
              acc[field.id] = field.value;
              return acc;
            },
            {} as Record<string, string>,
          ),
        })
        .eq("id", input.voter_id)
        .eq("election_id", input.election_id);
    }),
});
