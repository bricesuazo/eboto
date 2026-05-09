import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: '/sign-in' });
    }
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  return <Outlet />;
}
