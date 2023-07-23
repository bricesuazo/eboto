import { AppRouter } from "@/server/routers/_app";
import { createTRPCReact } from "@trpc/react-query";

export const api_client = createTRPCReact<AppRouter>({
  overrides: {
    useMutation: {
      async onSuccess(opts) {
        await opts.originalFn();
        await opts.queryClient.invalidateQueries();
      },
    },
  },
});
