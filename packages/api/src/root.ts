import { authRouter } from "./router/auth";
import { electionRouter } from "./router/election";
import { userRouter } from "./router/user";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  election: electionRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
