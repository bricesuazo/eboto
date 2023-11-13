import { cookies, headers } from "next/headers";
import { loggerLink } from "@trpc/client";
import { experimental_nextCacheLink as nextCacheLink } from "@trpc/next/app-dir/links/nextCache";
import { experimental_createTRPCNextAppDirServer as createTRPCNextAppDirServer } from "@trpc/next/app-dir/server";
// import { env } from "env.mjs";
// import { experimental_nextHttpLink as nextHttpLink } from "@trpc/next/app-dir/links/nextHttp";
import superjson from "superjson";
import { UTApi } from "uploadthing/server";

import { appRouter } from "@eboto/api";
import type { AppRouter } from "@eboto/api";
import { auth } from "@eboto/auth";
import { db } from "@eboto/db";

import { endingLink } from "./shared";

/**
 * This client invokes procedures directly on the server without fetching over HTTP.
 */
export const api = createTRPCNextAppDirServer<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        loggerLink({
          enabled: () => true,
        }),
        endingLink({
          headers: Object.fromEntries(headers().entries()),
        }),
        nextCacheLink({
          revalidate: false,
          router: appRouter,
          async createContext() {
            return {
              utapi: new UTApi({
                fetch: globalThis.fetch,
                // apiKey: env.UPLOADTHING_SECRET,
              }),
              session: await auth(),
              db,
              headers: {
                cookie: cookies().toString(),
                "x-trpc-source": "rsc-invoke",
              },
            };
          },
        }),
      ],
    };
  },
});
