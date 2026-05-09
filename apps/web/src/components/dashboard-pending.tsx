import { Skeleton } from '~/components/ui/skeleton';

/**
 * Pending state for `/dashboard/$electionDashboardSlug/*` sub-routes —
 * rendered inside the parent's sidebar shell while route loaders fetch data.
 */
export function DashboardPending() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
