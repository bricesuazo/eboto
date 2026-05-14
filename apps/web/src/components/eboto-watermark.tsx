import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { api } from '@eboto/backend/api';

/**
 * Pinned bottom-right badge advertising eBoto on free-tier election pages.
 * Hidden when the election is on Boost (which includes the
 * `noWatermark` feature flag).
 */
export function EBotoWatermark({ slug }: { slug: string }) {
  const { data } = useQuery(
    convexQuery(api.billing.getPublicElectionFeatures, { slug }),
  );
  if (!data || data.features.noWatermark) return null;
  return (
    <Link
      to="/"
      aria-label="Made with eBoto"
      className="fixed right-3 bottom-3 z-40 rounded-full bg-foreground/90 px-3 py-1.5 text-xs font-medium text-background shadow-md backdrop-blur transition-colors hover:bg-foreground"
    >
      Made with eBoto
    </Link>
  );
}
