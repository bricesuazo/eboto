import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, Check, ChevronDown, Sparkles } from 'lucide-react';

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
import { HOME_FAQS, HOME_FEATURES, HOME_PRICING } from '~/lib/constants/home';
import { cn } from '~/lib/utils';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <Pricing />
      <Faq />
      <FinalCta />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,var(--color-primary),transparent_60%)]/18"
        aria-hidden
      />
      <div className="container mx-auto max-w-6xl px-6 py-20 sm:py-28 lg:py-32">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5">
            <Sparkles className="size-3" />
            Open-source online voting platform
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Your one-stop online voting solution
          </h1>
          <p className="text-muted-foreground mt-6 max-w-2xl text-balance text-lg sm:text-xl">
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
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to run an election
          </h2>
          <p className="text-muted-foreground mt-4">
            Built for organizations that want secure voting without standing up
            their own infrastructure.
          </p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_FEATURES.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="border-border/60">
              <CardHeader>
                <div className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-lg">
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
  return (
    <section id="pricing" className="border-b">
      <div className="container mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple pricing
          </h2>
          <p className="text-muted-foreground mt-4">
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
                  'border-primary ring-primary/20 shadow-lg ring-1',
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
                  <span className="text-3xl font-bold tracking-tight">
                    {tier.price}
                  </span>
                  {tier.cadence && (
                    <span className="text-muted-foreground text-sm">
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
                      <Check className="text-primary mt-0.5 size-4 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex-1" />
                <Button
                  render={<Link to={tier.cta.to}>{tier.cta.label}</Link>}
                  variant={tier.highlighted ? 'default' : 'outline'}
                  className="mt-6 w-full"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="border-b">
      <div className="container mx-auto max-w-3xl px-6 py-20 sm:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground mt-4">
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
        <div className="mt-12 divide-border/60 border-border/60 divide-y rounded-xl border">
          {HOME_FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium">
                <span>{q}</span>
                <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
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
        <Card className="border-primary/30 from-primary/10 bg-linear-to-br to-transparent">
          <CardContent className="flex flex-col items-center gap-6 px-6 py-12 text-center sm:px-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Run your next election on eBoto
            </h2>
            <p className="text-muted-foreground max-w-xl">
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
              />
              <Button
                render={<Link to="/contact">Talk to us</Link>}
                size="lg"
                variant="outline"
              />
            </div>
            <Separator className="bg-border/60 mt-2" />
            <p className="text-muted-foreground text-xs">
              Open-source · Built in the Philippines · contact@eboto.app
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
