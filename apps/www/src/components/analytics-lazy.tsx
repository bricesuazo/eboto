import { useEffect } from 'react';
import dynamic from 'next/dynamic';

// Lazy load analytics to improve Time to Interactive
const AnalyticsLazy = dynamic(
  () => import('@vercel/analytics/react').then(mod => ({ default: mod.Analytics })),
  {
    ssr: false,
  }
);

const SpeedInsightsLazy = dynamic(
  () => import('@vercel/speed-insights/next').then(mod => ({ default: mod.SpeedInsights })),
  {
    ssr: false,
  }
);

// Load analytics after the page has loaded and is interactive
export function DeferredAnalytics() {
  useEffect(() => {
    // Defer analytics loading until after initial render
    const timer = setTimeout(() => {
      // Analytics will be loaded here
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnalyticsLazy />
      <SpeedInsightsLazy />
    </>
  );
}