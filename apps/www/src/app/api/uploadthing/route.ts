import { env } from "env.mjs";

import { createNextRouteHandler, mainFileRouter } from "@eboto-mo/storage";

// Export routes for Next App Router
export const { GET, POST } = createNextRouteHandler({
  router: mainFileRouter,
  config: {
    uploadthingId: env.UPLOADTHING_APP_ID,
    uploadthingSecret: env.UPLOADTHING_SECRET,
  },
});
