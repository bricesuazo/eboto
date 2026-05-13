import type { Doc } from '../_generated/dataModel';

/**
 * Boost is priced ₱499 base + ₱200 per voter-cap step. LemonSqueezy stores
 * prices in the smallest currency unit (cents) — so ₱499 is `49900` in the
 * API. The variants table is seeded (via `billing.syncBoostVariants`) with
 * one row per tier keyed by that cents value; the pricing slider on the
 * marketing page and the dashboard paywall both emit prices in cents, and
 * the checkout action looks the variant up by `(productId, price)`.
 * Mirrors `apps/web/src/lib/constants/pricing.ts`.
 */
export const BOOST_PRICE_TO_VOTER_CAP: Record<number, number> = {
  49900: 1500,
  69900: 2500,
  89900: 5000,
  109900: 7500,
  129900: 10000,
};

export const BOOST_PRICES = Object.keys(BOOST_PRICE_TO_VOTER_CAP).map(Number);

/** Voter cap baked into the free tier — also enforced on the client. */
export const FREE_TIER_VOTER_CAP = 500;

/**
 * Hour bucket used to gate free-tier real-time results. Free elections only
 * see vote counts truncated to the hour boundary that has *already* elapsed —
 * so at 8:51 AM you see counts up to 8:00 AM, and at 9:00 AM the bucket
 * advances. Boost elections see everything live.
 */
export const FREE_RESULTS_LATENCY_MS = 60 * 60 * 1000;

/** Cutoff (exclusive) for free-tier results given `now`. */
export function freeTierResultsCutoff(now: number): number {
  return Math.floor(now / FREE_RESULTS_LATENCY_MS) * FREE_RESULTS_LATENCY_MS;
}

/**
 * Returns true when the election is on the free plan (no Boost purchased
 * yet). We use `variantId === 0` as the sentinel — `elections.create` writes
 * `0` for new elections and the LemonSqueezy webhook patches it on Boost
 * order success.
 */
export function isFreeTier(election: Pick<Doc<'elections'>, 'variantId'>) {
  return !election.variantId || election.variantId === 0;
}

export interface ElectionTier {
  isBoost: boolean;
  voterCap: number;
  features: {
    /** Realtime (per-vote) result updates — otherwise gated to hourly. */
    realtimeResults: boolean;
    /** Live admin support chat. */
    liveSupport: boolean;
    /** Realtime chat with voters. */
    realtimeChat: boolean;
    /** Hides eBoto watermark on public pages. */
    noWatermark: boolean;
    adFree: boolean;
  };
}

/**
 * Derives feature flags from an election row. Free vs Boost is the only
 * distinction today; the per-tier voter cap is determined by the buyer at
 * checkout time and is persisted on the election (`voterCap`).
 */
export function getElectionTier(
  election: Pick<Doc<'elections'>, 'variantId' | 'voterCap'>,
): ElectionTier {
  const free = isFreeTier(election);
  return {
    isBoost: !free,
    voterCap: election.voterCap ?? (free ? FREE_TIER_VOTER_CAP : 0),
    features: {
      realtimeResults: !free,
      liveSupport: !free,
      realtimeChat: !free,
      noWatermark: !free,
      adFree: !free,
    },
  };
}
