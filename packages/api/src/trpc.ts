import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { UTApi } from "uploadthing/server";
import { ZodError } from "zod";

import { auth } from "@eboto-mo/auth";
import type { Session } from "@eboto-mo/auth";
import { db } from "@eboto-mo/db";

// import { env } from "./env.mjs";

interface CreateContextOptions {
  session: Session | null;
  utapi: UTApi;
}
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    db,
    utapi: opts.utapi,
  };
};

export async function createTRPCContext(opts: {
  req?: Request;
  session: Session | null;
}) {
  // const source = opts.req?.headers.get("x-trpc-source") ?? "unknown";

  // console.log(">>> tRPC Request from", source, "by", session?.user);

  return createInnerTRPCContext({
    session: opts.session ?? (await auth()),
    utapi: new UTApi({
      // fetch: globalThis.fetch,
      // apiKey: env.UPLOADTHING_SECRET,
    }),
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
