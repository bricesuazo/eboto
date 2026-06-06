import { Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Home, Vote } from 'lucide-react';

import { Button } from '~/components/ui/button';

export function NotFound() {
  const router = useRouter();
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="space-y-2">
        <p className="text-6xl font-bold text-muted-foreground/40">404</p>
        <h1 className="text-2xl ">We couldn't find that page</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The election, dashboard, or page you're looking for might have been
          moved, deleted, or never existed.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.history.back()}
        >
          <ArrowLeft className="size-4" /> Back
        </Button>
        <Button variant="outline" size="sm" render={<Link to="/" />}>
          <Home className="size-4" /> Home
        </Button>
        <Button size="sm" render={<Link to="/dashboard" />}>
          <Vote className="size-4" /> My elections
        </Button>
      </div>
    </main>
  );
}
