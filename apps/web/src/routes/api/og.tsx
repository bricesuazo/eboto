import { createFileRoute } from '@tanstack/react-router';
import { ImageResponse } from '@vercel/og';

import {
  OG_CACHE_HEADERS,
  OG_COLORS,
  OG_FALLBACK_TITLE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  OG_MAX_DATE_LEN,
  OG_MAX_NAME_LEN,
  OG_MAX_POSITION_LEN,
} from '~/lib/constants';

function clip(value: string | null, max: number): string {
  if (!value) return '';
  return value.length > max ? value.slice(0, max - 1).trimEnd() + '…' : value;
}

// Anything rendered into <img> is fetched server-side by satori. Only allow
// the project's Convex storage hosts so the endpoint can't be abused as an
// SSRF or arbitrary-image proxy.
function safeImage(raw: string): string | null {
  if (!raw) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  if (
    !parsed.host.endsWith('.convex.cloud') &&
    !parsed.host.endsWith('.convex.site')
  ) {
    return null;
  }
  return parsed.toString();
}

function fallbackCard() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #16a34a 0%, #064e3b 100%)',
          color: 'white',
          fontSize: 96,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        eBoto
      </div>
    ),
    {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      headers: OG_CACHE_HEADERS,
    },
  );
}

function electionCard(params: {
  electionName: string;
  electionDate: string;
  electionLogo: string | null;
}) {
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
        {params.electionLogo ? (
          <img
            src={params.electionLogo}
            width={160}
            height={160}
            style={{ borderRadius: 999, objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              width: 160,
              height: 160,
              borderRadius: 999,
              background: OG_COLORS.surface,
            }}
          />
        )}
        <div
          style={{
            display: 'flex',
            fontSize: 56,
            fontWeight: 700,
            color: OG_COLORS.foreground,
            textAlign: 'center',
            lineHeight: 1.15,
          }}
        >
          {params.electionName}
        </div>
        {params.electionDate && (
          <div
            style={{ display: 'flex', fontSize: 28, color: OG_COLORS.muted }}
          >
            {params.electionDate}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            color: OG_COLORS.primary,
            marginTop: 24,
          }}
        >
          Powered by eBoto
        </div>
      </div>
    ),
    {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      headers: OG_CACHE_HEADERS,
    },
  );
}

function candidateCard(params: {
  candidateName: string;
  candidatePosition: string;
  candidateImg: string | null;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          background: '#fff',
          padding: '64px',
          fontFamily: 'sans-serif',
          gap: 48,
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 380,
            height: 380,
            background: OG_COLORS.surface,
            borderRadius: 24,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {params.candidateImg && (
            <img
              src={params.candidateImg}
              width={380}
              height={380}
              style={{ objectFit: 'cover' }}
            />
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 16,
            flex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 60,
              fontWeight: 700,
              color: OG_COLORS.foreground,
              lineHeight: 1.1,
            }}
          >
            {params.candidateName}
          </div>
          {params.candidatePosition && (
            <div
              style={{ display: 'flex', fontSize: 32, color: OG_COLORS.muted }}
            >
              {params.candidatePosition}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              color: OG_COLORS.primary,
              marginTop: 24,
            }}
          >
            Powered by eBoto
          </div>
        </div>
      </div>
    ),
    {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      headers: OG_CACHE_HEADERS,
    },
  );
}

export const Route = createFileRoute('/api/og')({
  server: {
    handlers: {
      GET: ({ request }) => {
        try {
          const url = new URL(request.url);
          const type = url.searchParams.get('type') ?? 'default';

          if (type === 'candidate') {
            return candidateCard({
              candidateName: clip(
                url.searchParams.get('candidate_name'),
                OG_MAX_NAME_LEN,
              ),
              candidatePosition: clip(
                url.searchParams.get('candidate_position'),
                OG_MAX_POSITION_LEN,
              ),
              candidateImg: safeImage(
                url.searchParams.get('candidate_img') ?? '',
              ),
            });
          }

          if (type === 'election') {
            return electionCard({
              electionName: clip(
                url.searchParams.get('election_name') ?? OG_FALLBACK_TITLE,
                OG_MAX_NAME_LEN,
              ),
              electionDate: clip(
                url.searchParams.get('election_date'),
                OG_MAX_DATE_LEN,
              ),
              electionLogo: safeImage(
                url.searchParams.get('election_logo') ?? '',
              ),
            });
          }

          return fallbackCard();
        } catch {
          return fallbackCard();
        }
      },
    },
  },
});
