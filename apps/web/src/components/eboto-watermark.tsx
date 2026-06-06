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
      className="fixed right-3 flex items-center gap-1 bottom-3 z-40 rounded-full bg-foreground/90 px-3 py-2 shadow-md backdrop-blur transition-colors hover:bg-foreground"
    >
      <img src="/logo.png" alt="eBoto" width={16} height={16} />
      <span className='text-xs font-semibold text-background'>Made with eBoto</span>
    </Link>
  );
}
