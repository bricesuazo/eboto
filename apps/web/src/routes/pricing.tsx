import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
});

const TIERS = [
  {
    name: 'Free',
    price: '₱0',
    blurb: 'Up to 1,500 voters per election',
    features: ['One election', 'Magic-link voting', 'Realtime results'],
  },
  {
    name: 'Plus',
    price: '₱200',
    blurb: 'Per credit · use one when you create an election',
    features: ['Custom voter quota', 'Voter chat', 'No ads'],
  },
];

function PricingPage() {
  return (
    <main className="container mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-center text-4xl font-bold">Pricing</h1>
      <p className="text-muted-foreground mt-2 text-center">
        Pay only when you need more headroom.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {TIERS.map((tier) => (
          <div key={tier.name} className="rounded-xl border p-6">
            <h2 className="text-2xl font-semibold">{tier.name}</h2>
            <p className="mt-1 text-3xl font-bold">{tier.price}</p>
            <p className="text-muted-foreground mt-1">{tier.blurb}</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {tier.features.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
