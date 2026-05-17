import { useState } from 'react';
import { useAction } from 'convex/react';
import { ConvexError } from 'convex/values';
import { Lock, Rocket } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@eboto/backend/api';
import type { Id } from '@eboto/backend/data-model';

import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Slider } from '~/components/ui/slider';
import type { BoostPrice } from '~/lib/constants/pricing';
import { BOOST_BASE_PRICE, num, peso, tierAt } from '~/lib/constants/pricing';
import { cn } from '~/lib/utils';

/**
 * Inline paywall used on Boost-only dashboard pages (live support, realtime
 * voter chat). Lets the commissioner pick a tier and launch the LemonSqueezy
 * checkout right inline — no detour to the marketing pricing page.
 */
export function BoostPaywall({
  electionId,
  title,
  description,
  className,
}: {
  electionId: Id<'elections'>;
  title: string;
  description: string;
  className?: string;
}) {
  const [value, setValue] = useState(0);
  const [pending, setPending] = useState(false);
  const createBoostCheckout = useAction(api.billing.createBoostCheckout);

  const tier = tierAt(value);
  const isUnlimited = tier.label === -1;

  async function handleUpgrade() {
    if (isUnlimited) {
      window.location.href = '/contact';
      return;
    }
    setPending(true);
    try {
      const price = ((BOOST_BASE_PRICE + tier.priceAdded) * 100) as BoostPrice;
      const { url } = await createBoostCheckout({ electionId, price });
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
    <Card
      className={cn(
        'border-2 border-dashed border-emerald-500/50 dark:border-emerald-800',
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-500">
          <Lock className="size-5" />
        </div>
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="text-3xl font-bold">
            {isUnlimited
              ? 'Contact us'
              : peso.format(BOOST_BASE_PRICE + tier.priceAdded)}
          </div>
          <p className="text-sm text-muted-foreground">
            One-time, per election — up to{' '}
            {isUnlimited ? 'unlimited' : num.format(tier.label)} voters
          </p>
          <Slider
            value={[value]}
            onValueChange={(v: number | readonly number[]) =>
              setValue(typeof v === 'number' ? v : (v[0] ?? 0))
            }
            min={0}
            max={100}
            step={20}
            className="mt-3"
          />
        </div>

        <Button
          type="button"
          size="lg"
          onClick={handleUpgrade}
          disabled={pending}
          className="w-full rounded-full"
        >
          {pending
            ? 'Opening checkout…'
            : isUnlimited
              ? 'Contact us'
              : 'Upgrade to Boost'}
          <Rocket className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
