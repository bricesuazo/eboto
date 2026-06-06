import { convexQuery } from '@convex-dev/react-query';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  notFound,
  Outlet,
} from '@tanstack/react-router';
import dayjs from 'dayjs';
import { ExternalLink, Lock, Sparkles } from 'lucide-react';

import { api } from '@eboto/backend/api';
import { votingStartAt } from '@eboto/backend/election-timing';

import { ReportProblemDialog } from '~/components/report-problem-dialog';
import { Badge } from '~/components/ui/badge';
import { Separator } from '~/components/ui/separator';
import {
  CONVEX_ERROR_FORBIDDEN,
  CONVEX_ERROR_NOT_FOUND,
} from '~/lib/constants';
import { DASHBOARD_NAV_ITEMS } from '~/lib/constants/nav';
import { getConvexErrorCode } from '~/lib/convex-error';
import { parseHourTo12HourFormat } from '~/lib/election';

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
      await context.queryClient.ensureQueryData(
        convexQuery(api.billing.getElectionTierBySlug, {
          slug: params.electionDashboardSlug,
        }),
      );
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
  const { data: tier } = useQuery(
    convexQuery(api.billing.getElectionTierBySlug, {
      slug: electionDashboardSlug,
    }),
  );
  if (!election) throw notFound();

  // Voting opens at this absolute moment; once we're past it, all
  // ballot-affecting mutations are rejected server-side. We mirror that
  // server policy in the UI so commissioners see the lock before they try.
  const lockAt = votingStartAt(election);
  const locked = Date.now() >= lockAt;

  return (
    <div className="container mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[200px_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <div className="mb-4">
          <p className="text-xs text-muted-foreground uppercase">Managing</p>
          <div className="flex items-center gap-2">
            <h2 className="truncate font-semibold">{election.name}</h2>
            {locked && (
              <Badge
                variant="outline"
                className="mt-1 gap-1 border-amber-300/60 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
              >
                <Lock className="size-3" />
                Locked
              </Badge>
            )}
          </div>
          {tier &&
            (tier.isBoost ? (
              <Badge className="mt-1 gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300">
                <Sparkles className="size-3" />
                Boost · {tier.voterCap.toLocaleString()} voter cap
              </Badge>
            ) : (
              <Badge variant="outline" className="mt-1">
                Free · {tier.voterCap.toLocaleString()} voter cap
              </Badge>
            ))}

          <Link
            to="/$electionSlug"
            params={{ electionSlug: election.slug }}
            className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
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
        <Separator className="my-3" />
        <ReportProblemDialog electionId={election._id} />
      </aside>

      <main className="min-w-0">
        {locked && <LockedBanner election={election} />}
        <Outlet />
      </main>
    </div>
  );
}

function LockedBanner({
  election,
}: {
  election: {
    startDate: number;
    votingHourStart: number;
    votingHourEnd: number;
    endDate: number;
  };
}) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
      <Lock
        className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden
      />
      <div className="space-y-1">
        <p className="font-medium text-amber-900 dark:text-amber-100">
          Editing is locked — voting has started
        </p>
        <p className="text-sm leading-relaxed text-amber-900/80 dark:text-amber-200/80">
          Voting opened on{' '}
          <span className="font-medium">
            {dayjs(election.startDate).format('MMMM D, YYYY')}
          </span>{' '}
          at{' '}
          <span className="font-medium">
            {parseHourTo12HourFormat(election.votingHourStart)}
          </span>
          . To preserve ballot integrity, changes to candidates, positions,
          partylists, voters, voter fields, and election settings (including the
          logo, timing, and publicity) are now permanently locked — even after
          voting concludes on{' '}
          <span className="font-medium">
            {dayjs(election.endDate).format('MMMM D, YYYY')}
          </span>{' '}
          at{' '}
          <span className="font-medium">
            {parseHourTo12HourFormat(election.votingHourEnd)}
          </span>
          . You can still view this election, message voters, and download
          results.
        </p>
      </div>
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
