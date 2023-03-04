import { positionRouter } from "./routers/position";
import { createTRPCRouter } from "./trpc";
import { electionRouter } from "./routers/election";
import { userRouter } from "./routers/user";
import { tokenRouter } from "./routers/token";
import { voterRouter } from "./routers/voter";
import { candidateRouter } from "./routers/candidate";
import { partylistRouter } from "./routers/partylist";

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
  position: positionRouter,
  candidate: candidateRouter,
  partylist: partylistRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
