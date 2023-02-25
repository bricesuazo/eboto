import { createTRPCRouter } from "./trpc";
import { electionRouter } from "./routers/election";
import { userRouter } from "./routers/user";
import { tokenRouter } from "./routers/token";
import { voterRouter } from "./routers/voter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  election: electionRouter,
  voter: voterRouter,
  token: tokenRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
