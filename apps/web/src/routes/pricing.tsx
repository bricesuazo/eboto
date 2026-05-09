import { useEffect, useState } from 'react';
import { createFileRoute, Link, useRouteContext } from '@tanstack/react-router';
import { CheckCircle2, Mail, Plus, Rocket, XCircle } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Slider } from '~/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {
  BOOST_BASE_PRICE,
  num,
  peso,
  PLUS_PRICE,
  tierAt,
} from '~/lib/constants/pricing';
import { cn } from '~/lib/utils';

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
});

function PricingPage() {
  const [value, setValue] = useState(0);

  return (
    <main className="container mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <MainPricing value={value} setValue={setValue} />

      <section className="mt-32">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Compare
        </h2>
        <p className="mt-2 text-center text-muted-foreground">
          Compare all features between Free and Boost to see which one is right
          for you.
        </p>

        <div className="mt-8 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead />
                <TableHead>
                  <div className="text-xl font-semibold text-foreground">
                    Free
                  </div>
                  <div className="text-sm font-normal text-muted-foreground">
                    For a lifetime
                  </div>
                </TableHead>
                <TableHead>
                  <div className="text-xl font-semibold text-foreground">
                    Boost
                  </div>
                  <div className="text-sm font-normal text-muted-foreground">
                    Per Election
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Price</TableCell>
                <TableCell>{peso.format(0)}</TableCell>
                <TableCell className="font-bold">
                  {tierAt(value).label === -1
                    ? 'Contact us'
                    : peso.format(BOOST_BASE_PRICE + tierAt(value).priceAdded)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Number of Voters</TableCell>
                <TableCell>Up to 500</TableCell>
                <TableCell className="font-bold">
                  {tierAt(value).label === -1 ? (
                    'Unlimited'
                  ) : (
                    <>Up to {num.format(tierAt(value).label)}</>
                  )}
                  <Slider
                    value={[value]}
                    onValueChange={(v: number | readonly number[]) =>
                      setValue(typeof v === 'number' ? v : (v[0] ?? 0))
                    }
                    min={0}
                    max={100}
                    step={20}
                    className="mt-2 mb-4"
                  />
                </TableCell>
              </TableRow>
              <CheckRow label="Ad-Free" free={false} boost={true} />
              <CheckRow label="Live Support" free={false} boost={true} />
              <CheckRow
                label="Realtime Chat w/ Voters"
                free={false}
                boost={true}
              />
              <TableRow>
                <TableCell>Result Realtime Update</TableCell>
                <TableCell>Every hour</TableCell>
                <TableCell className="font-bold">Every second</TableCell>
              </TableRow>
              <CheckRow label="Watermark" free={false} boost={true} />
            </TableBody>
            <TableFooter className="bg-transparent">
              <TableRow className="border-b-0">
                <TableCell />
                <TableCell>
                  <Button
                    render={<Link to="/sign-in" />}
                    variant="outline"
                    size="lg"
                    className="w-full rounded-full"
                  >
                    Register
                  </Button>
                </TableCell>
                <TableCell>
                  <GetBoostButton value={value} />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </section>
    </main>
  );
}

function CheckRow({
  label,
  free,
  boost,
}: {
  label: string;
  free: boolean;
  boost: boolean;
}) {
  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell>
        <CheckIcon on={free} />
      </TableCell>
      <TableCell>
        <CheckIcon on={boost} />
      </TableCell>
    </TableRow>
  );
}

function CheckIcon({ on }: { on: boolean }) {
  return on ? (
    <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-500" />
  ) : (
    <XCircle className="size-6 text-muted-foreground" />
  );
}

function MainPricing({
  value,
  setValue,
}: {
  value: number;
  setValue: (v: number) => void;
}) {
  return (
    <>
      <h1 className="text-center text-4xl font-bold tracking-tight">Pricing</h1>
      <p className="mt-2 text-center text-muted-foreground">
        Unlock more features: Your Election Boost awaits.
      </p>

      <div className="mt-10 flex flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
          <FreeCard />
          <BoostCard value={value} setValue={setValue} />
          <CustomCard />
        </div>

        <PlusCard />
      </div>
    </>
  );
}

function PricingCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col justify-between gap-6 rounded-2xl border-4 p-6',
        'border-border',
        className,
      )}
    >
      {children}
    </div>
  );
}

function FreeCard() {
  return (
    <PricingCard className="min-h-80 flex-2 sm:min-h-112">
      <div>
        <h3 className="text-2xl font-semibold">Free</h3>
        <p className="text-muted-foreground">For a lifetime</p>
        <p className="mt-6 mb-2 text-lg font-semibold">Key Features</p>
        <ul className="space-y-2 text-sm">
          <FeatureItem>Every Hour Result Realtime Update</FeatureItem>
          <FeatureItem>Up to 500 voters</FeatureItem>
          <FeatureItem>Live Admin Support</FeatureItem>
        </ul>
      </div>
      <Button
        render={<Link to="/sign-in" />}
        variant="outline"
        size="lg"
        className="w-full rounded-full"
      >
        Register
      </Button>
    </PricingCard>
  );
}

function BoostCard({
  value,
  setValue,
}: {
  value: number;
  setValue: (v: number) => void;
}) {
  const [internal, setInternal] = useState(value);

  useEffect(() => {
    setInternal(value);
  }, [value]);

  const tier = tierAt(internal);

  return (
    <PricingCard
      className={cn(
        'min-h-80 flex-3 sm:min-h-128',
        'border-emerald-500 dark:border-emerald-800',
      )}
    >
      <div>
        <h3 className="text-2xl font-semibold">Boost</h3>
        <div className="text-4xl font-bold">
          {tier.label === -1
            ? 'Contact us'
            : peso.format(BOOST_BASE_PRICE + tier.priceAdded)}
        </div>
        <p className="text-muted-foreground">Per Election</p>
        <p className="mt-1">
          with up to {tier.label === -1 ? 'Unlimited' : num.format(tier.label)}{' '}
          voters
        </p>

        <Slider
          value={[internal]}
          onValueChange={(v: number | readonly number[]) => {
            const next = typeof v === 'number' ? v : (v[0] ?? 0);
            setValue(next);
          }}
          min={0}
          max={100}
          step={20}
          className="mt-6"
        />

        <p className="mt-8 mb-2 text-lg font-semibold">Key Features</p>
        <ul className="space-y-2 text-sm">
          <FeatureItem accent>Ad-Free</FeatureItem>
          <FeatureItem accent>Live Support</FeatureItem>
          <FeatureItem accent>Realtime Chat w/ Voters</FeatureItem>
          <FeatureItem accent>Realtime Update</FeatureItem>
          <FeatureItem accent>No Watermark</FeatureItem>
          <FeatureItem accent>Live Admin Support</FeatureItem>
        </ul>
      </div>

      <GetBoostButton value={internal} />
    </PricingCard>
  );
}

function CustomCard() {
  return (
    <PricingCard className="min-h-80 flex-2 sm:min-h-112">
      <div>
        <h3 className="text-2xl font-semibold">Custom</h3>
        <p className="text-muted-foreground">
          Want us to host your election locally?
        </p>
        <p className="mt-6 mb-2 text-lg font-semibold">Key Features</p>
        <ul className="space-y-2 text-sm">
          <FeatureItem>Unlimited Voters</FeatureItem>
          <FeatureItem>We will host your election in your facility</FeatureItem>
        </ul>
      </div>
      <Button
        render={<Link to="/contact" />}
        variant="outline"
        size="lg"
        className="w-full rounded-full"
      >
        Contact Us
        <Mail className="ml-2 size-4" />
      </Button>
    </PricingCard>
  );
}

function PlusCard() {
  const { user } = useRouteContext({ from: '__root__' });

  return (
    <div className="flex flex-col gap-4 rounded-2xl border-4 border-border p-6 md:flex-row md:justify-between">
      <div className="flex-4">
        <h3 className="text-2xl font-semibold">Plus</h3>
        <div className="text-4xl font-bold">{peso.format(PLUS_PRICE)}</div>
        <p className="text-muted-foreground">Per Election</p>
      </div>
      <div className="flex-2">
        <p className="text-lg font-semibold">Key Features</p>
        <ul className="mt-2 space-y-2 text-sm">
          <FeatureItem accent>Add 1 election to your account</FeatureItem>
        </ul>
      </div>
      <div className="flex flex-4 md:justify-end">
        <Button
          // TODO: wire to LemonSqueezy checkout (or a Convex action that
          // creates a checkout session) once payment creation is implemented
          // server-side. The webhook in convex/billing.ts already grants the
          // elections_plus credit on order_created.
          render={<Link to={user ? '/contact' : '/sign-in'} />}
          size="lg"
          className="w-full rounded-full md:w-auto"
        >
          Get Plus
          <Plus className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}

function GetBoostButton({ value }: { value: number }) {
  const { user } = useRouteContext({ from: '__root__' });

  if (value === 100) {
    return (
      <Button
        render={<Link to="/contact" />}
        size="lg"
        className="w-full rounded-full"
      >
        Contact Us
        <Mail className="ml-2 size-4" />
      </Button>
    );
  }

  // TODO: wire to checkout once payment creation is implemented (see PlusCard).
  return (
    <Button
      render={<Link to={user ? '/contact' : '/sign-in'} />}
      size="lg"
      className="w-full rounded-full"
    >
      Get Boost
      <Rocket className="ml-2 size-4" />
    </Button>
  );
}

function FeatureItem({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle2
        className={cn(
          'size-5 shrink-0',
          accent
            ? 'text-emerald-600 dark:text-emerald-500'
            : 'text-muted-foreground',
        )}
      />
      <span>{children}</span>
    </li>
  );
}
