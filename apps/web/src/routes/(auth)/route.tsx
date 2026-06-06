import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { safeInternalPath } from '~/lib/redirect';

export const Route = createFileRoute('/(auth)')({
  beforeLoad: ({ context, search }) => {
    if (context.user) {
      const target =
        safeInternalPath((search as { to?: unknown } | undefined)?.to) ??
        '/dashboard';
      throw redirect({ href: target });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return <Outlet />;
}
