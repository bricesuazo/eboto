import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import * as payment from "@eboto/payment";

import type { Database } from "./../../../supabase/types";

interface CreateContextOptions {
  session: Session | null;
  payment: typeof payment;
  supabase: SupabaseClient<Database>;
}
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    ...opts,
    payment,
  };
};

export function createTRPCContext(
  opts: CreateContextOptions & {
    req?: Request;
  },
) {
  const source = opts.req?.headers.get("x-trpc-source") ?? "unknown";

  console.log(">>> tRPC Request from", source, "by", opts.session?.user);

  return createInnerTRPCContext({
    ...opts,
    payment,
  });
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

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: {
        ...ctx.session,
      },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
