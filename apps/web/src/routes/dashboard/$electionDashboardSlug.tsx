import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  notFound,
  Outlet,
} from '@tanstack/react-router';
import { ExternalLink } from 'lucide-react';

import { api } from '@eboto/backend/api';

import { Separator } from '~/components/ui/separator';
import {
  CONVEX_ERROR_FORBIDDEN,
  CONVEX_ERROR_NOT_FOUND,
} from '~/lib/constants';
import { DASHBOARD_NAV_ITEMS } from '~/lib/constants/nav';
import { getConvexErrorCode } from '~/lib/convex-error';

export const Route = createFileRoute('/dashboard/$electionDashboardSlug')({
  loader: async ({ context, params }) => {
    // The parent `/dashboard` route's `beforeLoad` has already verified the
    // viewer is signed in, so this loader only needs to handle the
    // ownership check (`requireCommissioner` → forbidden) and 404s.
    try {
      const data = await context.queryClient.ensureQueryData(
        convexQuery(api.elections.getDashboardBySlug, {
          slug: params.electionDashboardSlug,
        }),
      );
      if (!data) throw notFound();
    } catch (err) {
      // forbidden → surface as 404 so we don't confirm the election's
      // existence to non-commissioners.
      const code = getConvexErrorCode(err);
      if (code === CONVEX_ERROR_FORBIDDEN || code === CONVEX_ERROR_NOT_FOUND) {
        throw notFound();
      }
      throw err;
    }
  },
  component: DashboardElectionShell,
});

function DashboardElectionShell() {
  const { electionDashboardSlug } = Route.useParams();
  const { data: election } = useSuspenseQuery(
    convexQuery(api.elections.getDashboardBySlug, {
      slug: electionDashboardSlug,
    }),
  );
  if (!election) throw notFound();

  return (
    <div className="container mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[200px_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <div className="mb-4">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Managing
          </p>
          <h2 className="truncate font-semibold">{election.name}</h2>
          <Link
            to="/$electionSlug"
            params={{ electionSlug: election.slug }}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
          >
            View public page <ExternalLink className="size-3" />
          </Link>
        </div>
        <Separator className="mb-3" />
        <nav className="flex flex-col gap-0.5">
          {DASHBOARD_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              label={item.label}
              icon={<item.icon className="size-4" />}
              electionDashboardSlug={electionDashboardSlug}
              exact={item.exact}
            />
          ))}
        </nav>
      </aside>

      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({
  to,
  label,
  icon,
  electionDashboardSlug,
  exact,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  electionDashboardSlug: string;
  exact?: boolean;
}) {
  const target = to
    ? `/dashboard/${electionDashboardSlug}/${to}`
    : `/dashboard/${electionDashboardSlug}`;
  return (
    <Link
      to={target}
      activeOptions={{ exact: exact ?? false }}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
      activeProps={{ className: 'bg-secondary text-foreground' }}
      inactiveProps={{
        className:
          'text-muted-foreground hover:bg-accent hover:text-foreground',
      }}
    >
      {icon}
      {label}
    </Link>
  );
}
