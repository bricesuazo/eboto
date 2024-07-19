import { createClient, type User } from "@supabase/supabase-js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { inngest } from "@eboto/inngest";
import * as payment from "@eboto/payment";

import type { Database } from "./../../../supabase/types";
import { env } from "./env.mjs";

export function createTRPCContext(opts: {
  user: { auth: User; db: Database["public"]["Tables"]["users"]["Row"] } | null;
  headers: Headers;
}) {
  const supabase = createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const source = opts.headers.get("x-trpc-source") ?? "unknown";

  console.log(
    ">>> tRPC Request from",
    source,
    "by",
    opts.user?.auth.email ?? opts.user?.db.email,
  );

  return { ...opts, payment, inngest, supabase };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter(opts) {
    const { shape, error } = opts;
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});
/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const { data: user_db } = await ctx.supabase
    .from("users")
    .select()
    .eq("id", ctx.user.auth.id)
    .single();

  if (!user_db) throw new TRPCError({ code: "UNAUTHORIZED" });

  return next({
    ctx: {
      ...ctx,
      user: {
        ...ctx.user,
        db: user_db,
      },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

export const createCallerFactory = t.createCallerFactory;
