import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import dayjs from 'dayjs';
import {
  CheckCircle2,
  Circle,
  Download,
  Flag,
  Replace,
  Users,
  UserSearch,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { api } from '@eboto/backend/api';

import { BoostPaywall } from '~/components/boost-paywall';
import { DashboardPending } from '~/components/dashboard-pending';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { cn } from '~/lib/utils';

const TURNOUT_COLORS = ['#16a34a', '#e5e7eb'] as const;

export const Route = createFileRoute('/dashboard/$electionDashboardSlug/')({
  beforeLoad: async ({ context, params }) => {
    const election = await context.queryClient.ensureQueryData(
      convexQuery(api.elections.getDashboardBySlug, {
        slug: params.electionDashboardSlug,
      }),
    );
    const tasks: Promise<unknown>[] = [
      context.queryClient.ensureQueryData(
        convexQuery(api.elections.getDashboardStats, {
          slug: params.electionDashboardSlug,
        }),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.billing.getElectionTierBySlug, {
          slug: params.electionDashboardSlug,
        }),
      ),
    ];
    if (election) {
      tasks.push(
        context.queryClient.ensureQueryData(
          convexQuery(api.results.listGeneratedReports, {
            electionId: election._id,
          }),
        ),
        context.queryClient.ensureQueryData(
          convexQuery(api.voterFields.statsByField, {
            electionId: election._id,
          }),
        ),
      );
    }
    await Promise.all(tasks);
  },
  pendingComponent: DashboardPending,
  component: OverviewPage,
});

function OverviewPage() {
  const { electionDashboardSlug } = Route.useParams();
  const { data: election } = useQuery(
    convexQuery(api.elections.getDashboardBySlug, {
      slug: electionDashboardSlug,
    }),
  );
  const { data: stats } = useQuery(
    convexQuery(api.elections.getDashboardStats, {
      slug: electionDashboardSlug,
    }),
  );
  const { data: reports = [] } = useQuery({
    ...convexQuery(api.results.listGeneratedReports, {
      electionId: election?._id ?? ('' as never),
    }),
    enabled: Boolean(election),
  });
  const { data: fieldStats = [] } = useQuery({
    ...convexQuery(api.voterFields.statsByField, {
      electionId: election?._id ?? ('' as never),
    }),
    enabled: Boolean(election),
  });
  const { data: tier } = useQuery(
    convexQuery(api.billing.getElectionTierBySlug, {
      slug: electionDashboardSlug,
    }),
  );

  if (!election || !stats) throw notFound();

  const turnoutData = [
    { name: 'Voted', value: stats.turnout.voted },
    { name: 'Not voted', value: stats.turnout.notVoted },
  ];
  const noVoters = stats.turnout.total === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Quick stats for {election.name}.
        </p>
      </div>

      {tier && !tier.isBoost && (
        <BoostPaywall
          electionId={election._id}
          title="Upgrade this election to Boost"
          description="Boost unlocks per-second result updates, realtime voter chat, live admin support, removes the watermark, and raises the voter cap (free is capped at 500)."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Voting window</CardDescription>
            <CardTitle className="text-base font-semibold">
              {dayjs(election.startDate).format('MMM D, YYYY')} –{' '}
              {dayjs(election.endDate).format('MMM D, YYYY')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Daily {election.votingHourStart}:00 – {election.votingHourEnd}:00
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Publicity</CardDescription>
            <CardTitle className="text-base font-semibold capitalize">
              {election.publicity.toLowerCase()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats.turnout.total.toLocaleString()} registered voter
              {stats.turnout.total === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Voter turnout</CardTitle>
            <CardDescription>
              {noVoters
                ? 'Add voters to start tracking turnout.'
                : `${stats.turnout.voted.toLocaleString()} of ${stats.turnout.total.toLocaleString()} voters cast a ballot.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        noVoters
                          ? [{ name: 'No voters', value: 1 }]
                          : turnoutData
                      }
                      dataKey="value"
                      innerRadius={56}
                      outerRadius={88}
                      paddingAngle={noVoters ? 0 : 2}
                      stroke="none"
                    >
                      {(noVoters
                        ? [{ name: 'No voters', value: 1 }]
                        : turnoutData
                      ).map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            noVoters ? '#e5e7eb' : (TURNOUT_COLORS[i] ?? '#ccc')
                          }
                        />
                      ))}
                    </Pie>
                    {!noVoters && (
                      <Tooltip
                        formatter={(value) => {
                          const n = Number(value);
                          return `${n.toLocaleString()} voter${n === 1 ? '' : 's'}`;
                        }}
                      />
                    )}
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">
                    {stats.turnout.percent}%
                  </span>
                  <span className="text-xs text-muted-foreground">turnout</span>
                </div>
              </div>
              <div className="flex gap-4 text-xs">
                <LegendDot color={TURNOUT_COLORS[0]} label="Voted" />
                <LegendDot color={TURNOUT_COLORS[1]} label="Not voted" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Partylists"
            value={stats.counts.partylists}
            icon={<Flag className="size-4" />}
          />
          <StatCard
            label="Positions"
            value={stats.counts.positions}
            icon={<Replace className="size-4" />}
          />
          <StatCard
            label="Candidates"
            value={stats.counts.candidates}
            icon={<UserSearch className="size-4" />}
          />
          <StatCard
            label="Voters"
            value={stats.counts.voters}
            icon={<Users className="size-4" />}
            caption={
              tier
                ? `of ${tier.voterCap.toLocaleString()} cap`
                : undefined
            }
          />
        </div>
      </div>

      <Card className="gap-1">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Voter turnout report</CardTitle>
            <CardDescription>
              {stats.checklist.hasEnded
                ? 'PDF reports auto-generate when the election ends. Download a fresh copy or trigger one manually.'
                : 'Available after the election ends. Generate one anyway if you need a snapshot now.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports yet.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {reports.map((r) => (
                <li
                  key={r._id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium">
                      {r.summary.percent}% turnout —{' '}
                      {r.summary.voted.toLocaleString()} of{' '}
                      {r.summary.total.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Generated{' '}
                      {dayjs(r.summary.generatedAt).format(
                        'MMM D, YYYY h:mm A',
                      )}
                    </div>
                  </div>
                  {r.url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      render={
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          download
                        >
                          <Download className="mr-1.5 size-4" /> Download
                        </a>
                      }
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Voter fields</CardTitle>
          <CardDescription>
            Turnout broken down by each custom voter field.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fieldStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No custom fields. Add some from the Voters page.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {fieldStats.map((f) => (
                <FieldStatsBlock key={f.fieldId} field={f} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup</CardTitle>
          <CardDescription>
            Items to complete before voters can cast their ballot.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <ChecklistItem done={stats.checklist.hasPartylist}>
            Add at least one partylist
          </ChecklistItem>
          <ChecklistItem done={stats.checklist.hasPosition}>
            Add at least one position
          </ChecklistItem>
          <ChecklistItem done={stats.checklist.hasCandidate}>
            Add at least one candidate
          </ChecklistItem>
          <ChecklistItem done={stats.checklist.hasVoter}>
            Register at least one voter
          </ChecklistItem>
          <ChecklistItem done={stats.checklist.hasStarted}>
            Election has started
          </ChecklistItem>
          <ChecklistItem done={stats.checklist.hasEnded}>
            Election has ended
          </ChecklistItem>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  caption,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  caption?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1.5">
          {icon}
          {label}
        </CardDescription>
        <CardTitle className="text-3xl">{value.toLocaleString()}</CardTitle>
        {caption && (
          <p className="text-muted-foreground text-xs">{caption}</p>
        )}
      </CardHeader>
    </Card>
  );
}

function ChecklistItem({
  done,
  children,
}: {
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm',
        done ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      {done ? (
        <CheckCircle2 className="size-4 text-primary" />
      ) : (
        <Circle className="size-4" />
      )}
      <span className={cn(done && 'line-through')}>{children}</span>
    </div>
  );
}

function FieldStatsBlock({
  field,
}: {
  field: {
    fieldId: string;
    name: string;
    type: string;
    buckets: { value: string; total: number; voted: number }[];
  };
}) {
  const chartData = field.buckets.map((b) => ({
    value: b.value,
    voted: b.voted,
    notVoted: Math.max(b.total - b.voted, 0),
    total: b.total,
  }));
  const chartHeight = Math.max(80, chartData.length * 36 + 24);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-sm">{field.name}</span>
        <span className="text-xs tracking-wide text-muted-foreground uppercase">
          {field.type}
        </span>
      </div>
      {chartData.length === 0 ? (
        <p className="text-xs text-muted-foreground">No voters yet.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
            >
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="value"
                width={96}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                formatter={(value, name) => {
                  const n = Number(value);
                  return [
                    `${n.toLocaleString()} voter${n === 1 ? '' : 's'}`,
                    name === 'voted' ? 'Voted' : 'Not voted',
                  ];
                }}
              />
              <Bar dataKey="voted" stackId="a" fill="#16a34a" />
              <Bar dataKey="notVoted" stackId="a" fill="#e5e7eb" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 text-xs">
            <LegendDot color="#16a34a" label="Voted" />
            <LegendDot color="#e5e7eb" label="Not voted" />
          </div>
        </>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block size-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
