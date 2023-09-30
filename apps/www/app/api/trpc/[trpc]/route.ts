// import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

// import { appRouter, createTRPCContext } from "@eboto-mo/api";
// import { auth } from "@eboto-mo/auth";

// export const runtime = "edge";

// /**
//  * Configure basic CORS headers
//  * You should extend this to match your needs
//  */
// function setCorsHeaders(res: Response) {
//   res.headers.set("Access-Control-Allow-Origin", "*");
//   res.headers.set("Access-Control-Request-Method", "*");
//   res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
//   res.headers.set("Access-Control-Allow-Headers", "*");
// }

// export function OPTIONS() {
//   const response = new Response(null, {
//     status: 204,
//   });
//   setCorsHeaders(response);
//   return response;
// }

// const handler = auth(async (req) => {
//   const response = await fetchRequestHandler({
//     endpoint: "/api/trpc",
//     router: appRouter,
//     req,
//     createContext: () => createTRPCContext({ auth: req.auth, req }),
//     onError({ error, path }) {
//       console.error(`>>> tRPC Error on '${path}'`, error);
//     },
//   });

//   setCorsHeaders(response);
//   return response;
// });

// export { handler as GET, handler as POST };

import type { NextRequest } from "next/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@eboto-mo/api";
import { auth } from "@eboto-mo/auth";

export const runtime = "edge";

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req: req,
    createContext: async () => createTRPCContext({ req, auth: await auth() }),
    onError: ({ error, path }) => {
      console.log("Error in tRPC handler (edge) on path", path);
      console.error(error);
    },
  });

export { handler as GET, handler as POST };
