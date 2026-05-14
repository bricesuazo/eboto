import { createFileRoute, Link } from '@tanstack/react-router';
import { Cookie, FileText, ScrollText, ShieldCheck } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

const SECTIONS = [
  {
    to: '/legal/privacy' as const,
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect your information.',
    icon: ShieldCheck,
  },
  {
    to: '/legal/terms' as const,
    title: 'Terms and Conditions',
    description: 'The agreement governing your use of eBoto.',
    icon: ScrollText,
  },
  {
    to: '/legal/cookie' as const,
    title: 'Cookie Policy',
    description: 'Which cookies we set and what they do.',
    icon: Cookie,
  },
  {
    to: '/legal/disclaimer' as const,
    title: 'Disclaimer',
    description: 'Limits of liability and warranty for the service.',
    icon: FileText,
  },
];

export const Route = createFileRoute('/legal/')({
  head: () => ({ meta: [{ title: 'Legal | eBoto' }] }),
  component: LegalIndex,
});

function LegalIndex() {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Legal</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The policies and agreements that govern your use of eBoto.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {SECTIONS.map(({ to, title, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full transition-colors hover:bg-accent/40">
              <CardHeader>
                <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <CardTitle className="mt-3 text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
