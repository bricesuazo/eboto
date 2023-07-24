import { createTRPCRouter } from "@/server/api/trpc";

// import { cookies } from "next/headers";
import { authRouter } from "./routers/auth";
import { electionRouter } from "./routers/election";
import { publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  election: electionRouter,
  auth: authRouter,
  // toggleTheme: publicProcedure.mutation(async () => {
  //   cookies().get("theme")?.value === "dark"
  //     ? cookies().set("theme", "light")
  //     : cookies().set("theme", "dark");
  // }),
});

export type AppRouter = typeof appRouter;
