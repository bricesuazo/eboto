import { createTRPCReact } from "@trpc/react-query";

import type { AppRouter } from "@eboto-mo/api";

export const api = createTRPCReact<AppRouter>({});
