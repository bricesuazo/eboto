/**
 * Pricing tiers shared by the marketing page, the dashboard upgrade flow, and
 * the LemonSqueezy checkout payload.
 *
 * The Boost checkout action keys off `price` — the backend looks up the
 * matching LemonSqueezy variant in the `variants` table by
 * `(productId, price)` (see `billing.syncBoostVariants`). `voterCap` is the
 * voter ceiling for that tier; `-1` is "unlimited" (contact-us tier, no
 * automated checkout). `priceAdded` is the slider-driven add-on charged on
 * top of the Boost base price.
 */
export const PRICING = [
  { value: 0, priceAdded: 0, label: 1500, voterCap: 1500 },
  { value: 20, priceAdded: 200, label: 2500, voterCap: 2500 },
  { value: 40, priceAdded: 400, label: 5000, voterCap: 5000 },
  { value: 60, priceAdded: 600, label: 7500, voterCap: 7500 },
  { value: 80, priceAdded: 800, label: 10000, voterCap: 10000 },
  { value: 100, priceAdded: 0, label: -1, voterCap: -1 },
] as const;

export type BoostTier = (typeof PRICING)[number];

/**
 * Boost prices the backend accepts, in **cents** (smallest currency unit) —
 * LemonSqueezy stores variant prices that way. The display constants above
 * (`BOOST_BASE_PRICE`, `priceAdded`) are in pesos; multiply by 100 before
 * calling the checkout action.
 */
export type BoostPrice = 49900 | 69900 | 89900 | 109900 | 129900;

/** Voter cap applied to elections on the free plan. */
export const FREE_TIER_VOTER_CAP = 500;

export const BOOST_BASE_PRICE = 499;
export const PLUS_PRICE = 199;

export const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const num = new Intl.NumberFormat('en-PH');

export function tierAt(value: number) {
  return PRICING.find((p) => p.value === value) ?? PRICING[0];
}
