import type { AppRouter } from "@eboto-mo/api";
import { createTRPCReact } from "@trpc/react-query";

export const api = createTRPCReact<AppRouter>({});
