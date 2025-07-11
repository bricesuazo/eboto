import dynamic from 'next/dynamic';
import type { ReactPlayerProps } from 'react-player/lazy';

// Lazy load ReactPlayer to reduce initial bundle size
const ReactPlayerDynamic = dynamic(
  () => import('react-player/lazy'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-64 bg-gray-100 rounded">
        <div className="text-gray-500">Loading video player...</div>
      </div>
    ),
  }
);

export default function ReactPlayerLazy(props: ReactPlayerProps) {
  return <ReactPlayerDynamic {...props} />;
}