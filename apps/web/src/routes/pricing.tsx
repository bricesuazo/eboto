import { useEffect, useMemo, useState } from 'react';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouteContext,
} from '@tanstack/react-router';
import { useAction } from 'convex/react';
import { ConvexError } from 'convex/values';
import { CheckCircle2, Mail, Minus, Plus, Rocket, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@eboto/backend/api';
import type { Id } from '@eboto/backend/data-model';

import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
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
import type { BoostPrice } from '~/lib/constants/pricing';
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
        <h2 className="text-center text-3xl font-bold">Compare</h2>
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
                  <div className="text-xl text-foreground">Free</div>
                  <div className="text-sm font-normal text-muted-foreground">
                    For a lifetime
                  </div>
                </TableHead>
                <TableHead>
                  <div className="text-xl text-foreground">Boost</div>
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
      <h1 className="text-center text-4xl font-bold">Pricing</h1>
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
        <h3 className="text-2xl">Free</h3>
        <p className="text-muted-foreground">For a lifetime</p>
        <p className="mt-6 mb-2 text-lg">Key Features</p>
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
        <h3 className="text-2xl">Boost</h3>
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

        <p className="mt-8 mb-2 text-lg">Key Features</p>
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
        <h3 className="text-2xl">Custom</h3>
        <p className="text-muted-foreground">
          Want us to host your election locally?
        </p>
        <p className="mt-6 mb-2 text-lg">Key Features</p>
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
        <Mail className="size-4" />
      </Button>
    </PricingCard>
  );
}

function PlusCard() {
  const { user } = useRouteContext({ from: '__root__' });
  const navigate = useNavigate();
  const createPlusCheckout = useAction(api.billing.createPlusCheckout);
  const [pending, setPending] = useState(false);
  const [quantity, setQuantity] = useState(1);

  async function handleClick() {
    if (!user) {
      void navigate({ to: '/sign-in' });
      return;
    }
    setPending(true);
    try {
      const { url } = await createPlusCheckout({ quantity });
      window.location.href = url;
    } catch (err) {
      const message =
        err instanceof ConvexError
          ? ((err.data as { message?: string }).message ?? 'Checkout failed')
          : 'Checkout failed';
      toast.error(message);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border-4 border-border p-6 md:flex-row md:justify-between">
      <div className="flex-4">
        <h3 className="text-2xl">Plus</h3>
        <div className="text-4xl font-bold">{peso.format(PLUS_PRICE)}</div>
        <p className="text-muted-foreground">Per Election</p>
      </div>
      <div className="flex-2">
        <p className="text-lg">Key Features</p>
        <ul className="mt-2 space-y-2 text-sm">
          <FeatureItem accent>Add 1 election to your account</FeatureItem>
        </ul>
      </div>
      <div className="flex flex-4 flex-col gap-3 md:items-end md:justify-end">
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          disabled={pending}
          ariaLabel="Number of Plus credits"
        />
        <Button
          size="lg"
          className="w-full rounded-full md:w-auto"
          onClick={handleClick}
          disabled={pending}
        >
          {pending
            ? 'Opening checkout…'
            : `Get Plus — ${peso.format(PLUS_PRICE * quantity)}`}
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

const PLUS_MIN = 1;
const PLUS_MAX = 100;

function QuantityStepper({
  value,
  onChange,
  disabled = false,
  ariaLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  function clamp(n: number) {
    return Math.max(PLUS_MIN, Math.min(PLUS_MAX, n));
  }
  return (
    <div className="inline-flex items-center rounded-full border">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-full"
        disabled={disabled ? true : value <= PLUS_MIN}
        onClick={() => onChange(clamp(value - 1))}
        aria-label="Decrease quantity"
      >
        <Minus className="size-4" />
      </Button>
      <input
        type="number"
        inputMode="numeric"
        min={PLUS_MIN}
        max={PLUS_MAX}
        value={value}
        onChange={(e) => {
          const parsed = Number.parseInt(e.target.value, 10);
          if (Number.isNaN(parsed)) return;
          onChange(clamp(parsed));
        }}
        disabled={disabled}
        aria-label={ariaLabel}
        className="w-12 [appearance:textfield] bg-transparent text-center text-sm font-medium tabular-nums outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-full"
        disabled={disabled ? true : value >= PLUS_MAX}
        onClick={() => onChange(clamp(value + 1))}
        aria-label="Increase quantity"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}

function GetBoostButton({ value }: { value: number }) {
  const { user } = useRouteContext({ from: '__root__' });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const tier = tierAt(value);

  if (value === 100 || tier.label === -1) {
    return (
      <Button
        render={<Link to="/contact" />}
        size="lg"
        className="w-full rounded-full"
      >
        Contact Us
        <Mail className="size-4" />
      </Button>
    );
  }

  return (
    <>
      <Button
        size="lg"
        className="w-full rounded-full"
        onClick={() => {
          if (!user) {
            void navigate({ to: '/sign-in' });
            return;
          }
          setOpen(true);
        }}
      >
        Get Boost
        <Rocket className="size-4" />
      </Button>
      <BoostElectionPickerDialog
        open={open}
        onOpenChange={setOpen}
        price={((BOOST_BASE_PRICE + tier.priceAdded) * 100) as BoostPrice}
        tierLabel={tier.label}
      />
    </>
  );
}

function BoostElectionPickerDialog({
  open,
  onOpenChange,
  price,
  tierLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  price: BoostPrice;
  tierLabel: number;
}) {
  const { data: elections, isPending } = useQuery({
    ...convexQuery(api.dashboard.myElections, {}),
    enabled: open,
  });
  const createBoostCheckout = useAction(api.billing.createBoostCheckout);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Hide elections that are already on Boost (variantId !== 0). The Boost
  // purchase needs to land on a free election.
  const upgradable = useMemo(
    () => (elections ?? []).filter((e) => !e.variantId || e.variantId === 0),
    [elections],
  );

  async function handlePick(electionId: Id<'elections'>) {
    setPendingId(electionId);
    try {
      const { url } = await createBoostCheckout({ electionId, price });
      window.location.href = url;
    } catch (err) {
      const message =
        err instanceof ConvexError
          ? ((err.data as { message?: string }).message ?? 'Checkout failed')
          : 'Checkout failed';
      toast.error(message);
      setPendingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose an election to Boost</DialogTitle>
          <DialogDescription>
            Boost upgrades a specific election to up to {num.format(tierLabel)}{' '}
            voters and unlocks live support, realtime chat, and per-second
            result updates.
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <p className="py-4 text-sm text-muted-foreground">Loading…</p>
        ) : upgradable.length === 0 ? (
          <div className="py-2 text-sm text-muted-foreground">
            <p>You don't have any free elections to upgrade.</p>
            <p className="mt-2">
              <Link to="/dashboard" className="underline">
                Go to the dashboard
              </Link>{' '}
              to create one first.
            </p>
          </div>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {upgradable.map((e) => (
              <li key={e._id}>
                <button
                  type="button"
                  disabled={pendingId !== null}
                  onClick={() => handlePick(e._id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors',
                    pendingId === e._id
                      ? 'opacity-70'
                      : 'hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <span>
                    <span className="font-medium">{e.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      /{e.slug}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {pendingId === e._id ? 'Opening…' : 'Boost'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
