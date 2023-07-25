import { authRouter } from "./router/auth";
import { electionRouter } from "./router/election";
import { createTRPCRouter } from "./trpc";

// Deployed to /trpc/edge/**
export const edgeRouter = createTRPCRouter({
  auth: authRouter,
  election: electionRouter,
});
