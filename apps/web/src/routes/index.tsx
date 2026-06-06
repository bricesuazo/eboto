import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, Check, ChevronDown, Rocket, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { Slider } from '~/components/ui/slider';
import { HOME_FAQS, HOME_FEATURES, HOME_PRICING } from '~/lib/constants/home';
import { BOOST_BASE_PRICE, num, peso, tierAt } from '~/lib/constants/pricing';
import { cn } from '~/lib/utils';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <main>
      <Hero />
      <WhatIsEboto />
      <Features />
      <Pricing />
      <Faq />
      <FinalCta />
    </main>
  );
}

function WhatIsEboto() {
  return (
    <section id="what" className="border-b">
      <div className="container mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <h2 className="text-center text-3xl font-bold text-balance sm:text-4xl">
          Ano ang eBoto? (What is eBoto?)
        </h2>
        <div className="mt-10 aspect-video overflow-hidden rounded-2xl border bg-muted shadow-sm">
          <iframe
            src="https://www.youtube.com/embed/BKud553RTbk?si=U5n1gPfc9OIfbt_U"
            title="What is eBoto?"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        className="bg-[radial-gradient(circle_at_top,var(--color-primary),transparent_60%)]/18 pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      />
      <div className="container mx-auto max-w-6xl px-6 py-20 sm:py-28 lg:py-32">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5">
            <Sparkles className="size-3" />
            Open-source online voting platform
          </Badge>
          <h1 className="text-4xl font-bold text-balance sm:text-5xl lg:text-6xl">
            Your one-stop online voting solution
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-balance text-muted-foreground sm:text-xl">
            eBoto is a versatile, web-based platform for running secure online
            elections — for student councils, organizations, and anything in
            between.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button
              render={
                <Link to="/sign-in">
                  Get started
                  <ArrowRight className="size-4" />
                </Link>
              }
              size="lg"
            />
            <Button
              render={<Link to="/pricing">View pricing</Link>}
              size="lg"
              variant="outline"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="border-b">
      <div className="container mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Everything you need to run an election
          </h2>
          <p className="mt-4 text-muted-foreground">
            Built for organizations that want secure voting without standing up
            their own infrastructure.
          </p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_FEATURES.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="border-border/60">
              <CardHeader>
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-pretty">
                  {body}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const [value, setValue] = useState(0);
  const tier = tierAt(value);
  const isUnlimited = tier.label === -1;

  return (
    <section id="pricing" className="border-b">
      <div className="container mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Simple pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free. Pay only when you need more headroom or features.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_PRICING.map((tier) => (
            <Card
              key={tier.name}
              className={cn(
                'flex flex-col',
                tier.highlighted &&
                  'border-primary shadow-lg ring-1 ring-primary/20',
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  {tier.highlighted && (
                    <Badge className="text-xs">Most popular</Badge>
                  )}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {tier.price}
                  </span>
                  {tier.cadence && (
                    <span className="text-sm text-muted-foreground">
                      {tier.cadence}
                    </span>
                  )}
                </div>
                <CardDescription className="mt-2 text-pretty">
                  {tier.blurb}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="space-y-2.5 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex-1" />
                <Button
                  render={<Link to={tier.cta.to}>{tier.cta.label}</Link>}
                  variant={tier.highlighted ? 'default' : 'outline'}
                  className="mt-6 w-full"
                  nativeButton={false}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Scale up only when you need to
          </h2>
          <p className="mt-4 text-muted-foreground">
            Drag the slider to see how Boost pricing scales with your voter
            count.
          </p>
        </div>

        <Card className="mt-10 border-emerald-500/40 dark:border-emerald-800">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                  Boost · per election
                </div>
                <div className="mt-2 text-5xl font-bold">
                  {isUnlimited
                    ? 'Contact us'
                    : peso.format(BOOST_BASE_PRICE + tier.priceAdded)}
                </div>
                <p className="mt-2 text-muted-foreground">
                  Up to{' '}
                  <span className=" text-foreground">
                    {isUnlimited ? 'Unlimited' : num.format(tier.label)}
                  </span>{' '}
                  voters
                </p>
              </div>

              <Button
                render={
                  <Link to={isUnlimited ? '/contact' : '/pricing'}>
                    {isUnlimited ? 'Contact us' : 'See full pricing'}
                    <Rocket className="size-4" />
                  </Link>
                }
                size="lg"
                className="rounded-full"
              />
            </div>

            <Slider
              value={[value]}
              onValueChange={(v: number | readonly number[]) => {
                const next = typeof v === 'number' ? v : (v[0] ?? 0);
                setValue(next);
              }}
              min={0}
              max={100}
              step={20}
              className="mt-8"
            />

            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>1.5K</span>
              <span>2.5K</span>
              <span>5K</span>
              <span>7.5K</span>
              <span>10K</span>
              <span>Unlimited</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="border-b">
      <div className="container mx-auto max-w-3xl px-6 py-20 sm:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-muted-foreground">
            Anything else?{' '}
            <Link
              to="/contact"
              className="text-primary underline-offset-4 hover:underline"
            >
              Get in touch
            </Link>
            .
          </p>
        </div>
        <div className="mt-12 divide-y divide-border/60 rounded-xl border border-border/60">
          {HOME_FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium">
                <span>{q}</span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-b">
      <div className="container mx-auto max-w-4xl px-6 py-20 sm:py-24">
        <Card className="border-primary/30 bg-linear-to-br from-primary/10 to-transparent">
          <CardContent className="flex flex-col items-center gap-6 px-6 py-12 text-center sm:px-12">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Run your next election on eBoto
            </h2>
            <p className="max-w-xl text-muted-foreground">
              Create an account in seconds. The free tier is enough for most
              student elections — upgrade only when you need more.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                render={
                  <Link to="/sign-in">
                    Create free account
                    <ArrowRight className="size-4" />
                  </Link>
                }
                size="lg"
                nativeButton={false}
              />
              <Button
                render={<Link to="/contact">Talk to us</Link>}
                size="lg"
                variant="outline"
                nativeButton={false}
              />
            </div>
            <Separator className="mt-2 bg-border/60" />
            <p className="text-xs text-muted-foreground">
              Open-source · contact@eboto.app
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
