import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { ArrowLeft } from 'lucide-react';

import { api } from '@eboto/backend/api';

import { ReportProblemDialog } from '~/components/report-problem-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

export const Route = createFileRoute('/account/reports')({
  head: () => ({
    meta: [{ title: 'My reports | eBoto' }],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: reports = [] } = useQuery(
    convexQuery(api.reportedProblems.listMine, {}),
  );
  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <Link
            to="/account"
            className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> Account
          </Link>
          <h1 className="text-2xl font-bold">My reports</h1>
          <p className="text-sm text-muted-foreground">
            Problems you've reported. Our team replies on the email tied to
            your account.
          </p>
        </div>
        <ReportProblemDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filed reports</CardTitle>
          <CardDescription>Up to the most recent 50.</CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven't filed any reports yet.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {reports.map((r) => (
                <li key={r._id} className="space-y-1 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{r.subject}</span>
                    <span className="text-xs text-muted-foreground">
                      {dayjs(r._creationTime).format('MMM D, YYYY')}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{r.description}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
