"use client";

import { createHydrateClient } from "@/trpc/@trpc/next-layout";
import superjson from "superjson";

export const HydrateClient = createHydrateClient({
  transformer: superjson,
});
