import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/account')({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: '/sign-in' });
    }
  },
  component: AccountLayout,
});

function AccountLayout() {
  return <Outlet />;
}
