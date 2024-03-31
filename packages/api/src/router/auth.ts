import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(async ({ ctx }) => {
    const { data: user } = await ctx.supabase
      .from("users")
      .select()
      .eq("id", ctx.session?.user.id ?? "")
      .single();

    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    return { session: ctx.session, user };
  }),
  getSessionProtected: protectedProcedure.query(async ({ ctx }) => {
    const { data: user } = await ctx.supabase
      .from("users")
      .select()
      .eq("id", ctx.session.user.id)
      .single();

    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    return { session: ctx.session, user };
  }),
});
