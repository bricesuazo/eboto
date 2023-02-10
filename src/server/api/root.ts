import { createTRPCRouter } from "./trpc";
import { electionRouter } from "./routers/election";
import { userRouter } from "./routers/user";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  election: electionRouter,
  user:userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
