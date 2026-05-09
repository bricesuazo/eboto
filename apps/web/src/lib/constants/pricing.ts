export const PRICING = [
  { value: 0, priceAdded: 0, label: 1500 },
  { value: 20, priceAdded: 200, label: 2500 },
  { value: 40, priceAdded: 400, label: 5000 },
  { value: 60, priceAdded: 600, label: 7500 },
  { value: 80, priceAdded: 800, label: 10000 },
  { value: 100, priceAdded: 0, label: -1 },
] as const;

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
