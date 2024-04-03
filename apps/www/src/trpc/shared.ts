import type { HTTPBatchLinkOptions, HTTPHeaders, TRPCLink } from "@trpc/client";
import { httpBatchLink } from "@trpc/client";
import { env } from "env.mjs";

import type { AppRouter } from "@eboto/api";

export const getBaseUrl = () => {
  if (typeof window !== "undefined") return "";

  return env.APP_URL;
  // return `http://localhost:3000`;
};
export function getUrl() {
  return getBaseUrl() + "/api/trpc";
}

export const endingLink = (opts?: { headers?: HTTPHeaders }) =>
  ((runtime) => {
    const sharedOpts = {
      headers: opts?.headers,
    } satisfies Partial<HTTPBatchLinkOptions>;

    const link = httpBatchLink({
      ...sharedOpts,
      url: getUrl(),
    })(runtime);
    return (ctx) => {
      const path = ctx.op.path.split(".") as [string, ...string[]];

      const newCtx = {
        ...ctx,
        op: { ...ctx.op, path: path.join(".") },
      };
      return link(newCtx);
    };
  }) satisfies TRPCLink<AppRouter>;
