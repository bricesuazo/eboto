import { convexQuery } from '@convex-dev/react-query';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  notFound,
  Outlet,
} from '@tanstack/react-router';
import dayjs from 'dayjs';
import { ExternalLink, Megaphone, Sparkles } from 'lucide-react';

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

  // Voting opens at this absolute moment. Past it the election isn't frozen —
  // safe corrections are still allowed — but every one of them is published to
  // the change log. We mirror that server policy here so commissioners know
  // what they're agreeing to before they start typing.
  const live = Date.now() >= votingStartAt(election);

  return (
    <div className="container mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[200px_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <div className="mb-4">
          <p className="text-xs text-muted-foreground uppercase">Managing</p>
          <div className="flex items-center gap-2">
            <h2 className="truncate font-semibold">{election.name}</h2>
            {live && (
              <Badge
                variant="outline"
                className="mt-1 gap-1 border-amber-300/60 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
              >
                <Megaphone className="size-3" />
                Live
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
        {live && (
          <LiveBanner
            election={election}
            electionDashboardSlug={electionDashboardSlug}
          />
        )}
        <Outlet />
      </main>
    </div>
  );
}

function LiveBanner({
  election,
  electionDashboardSlug,
}: {
  election: {
    startDate: number;
    votingHourStart: number;
  };
  electionDashboardSlug: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
      <Megaphone
        className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden
      />
      <div className="space-y-1">
        <p className="font-medium text-amber-900 dark:text-amber-100">
          Voting is live — changes are now public
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
          . You can still fix mistakes — names, descriptions, photos, the
          closing time, and the voter list — but each edit is recorded on this
          election&apos;s{' '}
          <Link
            to="/dashboard/$electionDashboardSlug/changes"
            params={{ electionDashboardSlug }}
            className="font-medium underline underline-offset-2"
          >
            change log
          </Link>
          , visible to everyone who can see the election, with your name and the
          reason you give. Changes that would invalidate ballots already cast —
          adding or removing candidates and positions, moving a candidate, or
          changing pick limits — stay blocked.
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
