import { auth, currentUser } from "@clerk/nextjs";
import { appRouter } from "@eboto-mo/api/src/root";
import type { AppRouter } from "@eboto-mo/api/src/root";
import { db } from "@eboto-mo/db";
import { loggerLink } from "@trpc/client";
import { experimental_nextCacheLink as nextCacheLink } from "@trpc/next/app-dir/links/nextCache";
import { experimental_createTRPCNextAppDirServer as createTRPCNextAppDirServer } from "@trpc/next/app-dir/server";
import { cookies, headers } from "next/headers";
import superjson from "superjson";

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
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        endingLink({
          headers: Object.fromEntries(headers().entries()),
        }),
        nextCacheLink({
          revalidate: 1,
          router: appRouter,
          async createContext() {
            await currentUser();
            const authentication = auth();
            return {
              auth: authentication,
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
