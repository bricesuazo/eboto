import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { Link, useMatchRoute } from '@tanstack/react-router';

import { api } from '@eboto/backend/api';

import { cn } from '~/lib/utils';

const PILL =
  'flex items-center gap-1 rounded-full bg-foreground/90 px-3 py-2 shadow-md backdrop-blur transition-colors hover:bg-foreground';

/**
 * Advertises eBoto on free-tier election pages. Hidden when the election is on
 * Boost (which includes the `noWatermark` feature flag).
 *
 * - `floating` (default): a badge pinned to the bottom-right of the viewport.
 *   Suppressed on the vote page, which renders its own `inline` badge inside
 *   its fixed action bar so the two don't overlap.
 * - `inline`: laid out in normal flow; meant to be dropped into that action bar.
 */
export function EBotoWatermark({
  slug,
  variant = 'floating',
}: {
  slug: string;
  variant?: 'floating' | 'inline';
}) {
  const { data } = useQuery(
    convexQuery(api.billing.getPublicElectionFeatures, { slug }),
  );
  const matchRoute = useMatchRoute();
  const onVotePage = Boolean(matchRoute({ to: '/$electionSlug/vote' }));

  if (!data || data.features.noWatermark) return null;
  // The vote page supplies its own inline badge inside the action bar; a
  // floating one would just overlap that bar's Submit button.
  if (variant === 'floating' && onVotePage) return null;

  return (
    <Link
      to="/"
      aria-label="Made with eBoto"
      className={cn(
        PILL,
        variant === 'floating' && 'fixed right-3 bottom-3 z-40',
      )}
    >
      <img src="/logo.png" alt="eBoto" width={16} height={16} />
      <span className="text-xs font-semibold text-background">
        Made with eBoto
      </span>
    </Link>
  );
}
