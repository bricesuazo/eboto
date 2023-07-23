import type { AppRouter } from "@/server/routers/_app";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";

export type Inputs = inferRouterInputs<AppRouter>;
export type Outputs = inferRouterOutputs<AppRouter>;

export function getBaseUrl() {
  if (typeof window !== "undefined") {
    // browser should use relative path
    return "";
  }
  if (process.env.VERCEL_URL) {
    // reference for vercel.com
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.RENDER_INTERNAL_HOSTNAME) {
    // reference for render.com
    const port = process.env.PORT;
    if (!port)
      throw new Error("PORT is not set but RENDER_INTERNAL_HOSTNAME is set");
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${port}`;
  }
  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
