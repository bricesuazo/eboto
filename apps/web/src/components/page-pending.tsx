import { Skeleton } from '~/components/ui/skeleton';

/**
 * Generic full-page pending state for top-level routes (election landing,
 * candidate detail, dashboard list, etc.). Shows after the route loader's
 * `pendingMs` timeout while the prior page stays mounted.
 */
export function PagePending() {
  return (
    <main className="container mx-auto max-w-4xl space-y-6 px-6 py-10">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-48 w-full" />
    </main>
  );
}
