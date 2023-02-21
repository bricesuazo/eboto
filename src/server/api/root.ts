import { createTRPCRouter } from "./trpc";
import { electionRouter } from "./routers/election";
import { userRouter } from "./routers/user";
import { tokenRouter } from "./routers/token";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  election: electionRouter,
  user: userRouter,
  token: tokenRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
