import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, ExternalLink, Sparkles } from 'lucide-react';

import { api } from '@eboto/backend/api';

import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '~/components/ui/card';

export const Route = createFileRoute('/account/billing')({
  head: () => ({
    meta: [{ title: 'Billing | eBoto' }],
  }),
  component: BillingPage,
});

function BillingPage() {
  const { data: summary } = useQuery(
    convexQuery(api.billing.myBillingSummary, {}),
  );

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div>
        <Link
          to="/account"
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Account
        </Link>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Your Plus credit balance and active Boost elections. Receipts come
          from Lemon Squeezy via the email on file.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plus credits</CardTitle>
          <CardDescription>
            Each Plus credit lets you create one extra election beyond your
            free election.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center sm:text-left">
          <Stat label="Available" value={summary?.plus.available ?? 0} />
          <Stat label="Redeemed" value={summary?.plus.redeemed ?? 0} />
          <Stat label="Total purchased" value={summary?.plus.owned ?? 0} />
          <div className="col-span-3">
            <Button
              variant="outline"
              size="sm"
              render={
                <Link to="/pricing">
                  Buy more <ExternalLink className="size-3" />
                </Link>
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Boost elections</CardTitle>
          <CardDescription>
            Elections you've upgraded to Boost. Voter cap reflects the tier
            you purchased.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!summary || summary.boostElections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No Boost elections yet. Upgrade an election from its dashboard.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {summary.boostElections.map((e) => (
                <li
                  key={e._id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <Sparkles className="size-3.5 text-amber-500" />
                      {e.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      /{e.slug}
                    </div>
                  </div>
                  <Badge variant="outline" className="font-medium">
                    {e.voterCap.toLocaleString()} cap
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl ">{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
