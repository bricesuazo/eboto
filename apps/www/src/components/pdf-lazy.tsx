import dynamic from 'next/dynamic';

// Lazy load PDF generation components to reduce initial bundle size
export const PDFDownloadLinkLazy = dynamic(
  () => import('@alexandernanberg/react-pdf-renderer').then(mod => ({ default: mod.PDFDownloadLink })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center px-4 py-2 bg-gray-100 rounded">
        <div className="text-sm text-gray-500">Loading PDF generator...</div>
      </div>
    ),
  }
);

export const GenerateResultLazy = dynamic(
  () => import('~/pdf/generate-result'),
  {
    ssr: false,
    loading: () => <div>Loading PDF template...</div>,
  }
);