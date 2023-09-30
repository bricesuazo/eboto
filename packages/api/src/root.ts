
import { authRouter } from "./router/auth";
import { electionRouter } from "./router/election";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  election: electionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;