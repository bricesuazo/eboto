import { authRouter } from "./router/auth";
import { candidateRouter } from "./router/candidate";
import { electionRouter } from "./router/election";
import { partylistRouter } from "./router/partylist";
import { paymentRouter } from "./router/payment";
import { positionRouter } from "./router/position";
import { systemRouter } from "./router/system";
import { userRouter } from "./router/user";
import { voterRouter } from "./router/voter";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  election: electionRouter,
  user: userRouter,
  candidate: candidateRouter,
  voter: voterRouter,
  position: positionRouter,
  partylist: partylistRouter,
  system: systemRouter,
  payment: paymentRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
