import { createTRPCRouter } from "./trpc";
import { electionRouter } from "./routers/election";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  election: electionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
