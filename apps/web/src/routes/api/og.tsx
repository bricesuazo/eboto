import { createFileRoute } from '@tanstack/react-router';
import { ImageResponse } from '@vercel/og';

import {
  OG_FALLBACK_TITLE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
} from '~/lib/constants';

export const Route = createFileRoute('/api/og')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        const type = url.searchParams.get('type') ?? 'default';
        const electionName =
          url.searchParams.get('election_name') ?? OG_FALLBACK_TITLE;
        const electionDate = url.searchParams.get('election_date') ?? '';
        const electionLogo = url.searchParams.get('election_logo') ?? '';

        if (type === 'election') {
          return new ImageResponse(
            (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  background: '#fff',
                  padding: '64px',
                  fontFamily: 'sans-serif',
                  gap: 24,
                }}
              >
                {electionLogo && (
                  <img
                    src={electionLogo}
                    width={160}
                    height={160}
                    style={{ borderRadius: '999px', objectFit: 'cover' }}
                  />
                )}
                <div
                  style={{
                    display: 'flex',
                    fontSize: 56,
                    fontWeight: 700,
                    color: '#0a0a0a',
                    textAlign: 'center',
                  }}
                >
                  {electionName}
                </div>
                {electionDate && (
                  <div
                    style={{ display: 'flex', fontSize: 28, color: '#666' }}
                  >
                    {electionDate}
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    fontSize: 24,
                    color: '#16a34a',
                    marginTop: 24,
                  }}
                >
                  Powered by eBoto
                </div>
              </div>
            ),
            { width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT },
          );
        }

        return new ImageResponse(
          (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                background:
                  'linear-gradient(135deg, #16a34a 0%, #064e3b 100%)',
                color: 'white',
                fontSize: 96,
                fontWeight: 800,
                fontFamily: 'sans-serif',
              }}
            >
              eBoto
            </div>
          ),
          { width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT },
        );
      },
    },
  },
});
