import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { env } from '~/env';

const bodySchema = z.object({
  name: z.string().optional(),
  email: z.email(),
  subject: z.string().min(1),
  message: z.string().min(10),
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * Per-IP fixed-window rate limit for the contact form. In-memory only — good
 * enough to slow a single client; a distributed attacker with rotating IPs
 * still requires upstream protection (Cloudflare, Vercel firewall). Kept
 * here rather than in Convex because the contact form is server-only and
 * doesn't otherwise touch the deployment.
 */
const CONTACT_WINDOW_MS = 60 * 60 * 1000;
const CONTACT_LIMIT_PER_WINDOW = 5;
const contactBuckets = new Map<string, { windowStart: number; count: number }>();
function takeContactToken(ip: string): boolean {
  const now = Date.now();
  const entry = contactBuckets.get(ip);
  if (!entry || now >= entry.windowStart + CONTACT_WINDOW_MS) {
    contactBuckets.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= CONTACT_LIMIT_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}
function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() ?? 'unknown';
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

function isCorsRequest(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return true;
  }
  const reqUrl = new URL(request.url);
  return (
    originUrl.host !== request.headers.get('host') ||
    originUrl.protocol !== reqUrl.protocol
  );
}

export const Route = createFileRoute('/api/contact')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (isCorsRequest(request)) {
          return jsonResponse({ error: 'Invalid origin' }, 403);
        }

        if (!takeContactToken(clientIp(request))) {
          return jsonResponse(
            { error: 'Too many messages from your network. Try again later.' },
            429,
          );
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return jsonResponse({ error: 'Invalid body' }, 400);
        }

        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) {
          const first = parsed.error.issues[0];
          return jsonResponse(
            { error: first?.message ?? 'Invalid input' },
            400,
          );
        }

        const { name, email, subject, message } = parsed.data;

        const embed = {
          title: '📩 New message from eboto.app',
          description: `>>> ${message.trim()}`,
          color: 5759645,
          fields: [
            {
              name: '📨 Subject',
              value: `\`\`\`${subject.trim()}\`\`\``,
              inline: true,
            },
            {
              name: '🧑‍🦱 Name',
              value: `\`\`\`${name?.trim() ? name.trim() : 'n/a'}\`\`\``,
              inline: true,
            },
            {
              name: '📨 Email',
              value: `\`\`\`${email.trim()}\`\`\``,
              inline: true,
            },
          ],
        };

        try {
          const response = await fetch(`${env.DISCORD_WEBHOOK_URL}?wait=true`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              avatar_url: 'https://eboto.app/logo.png',
              embeds: [embed],
            }),
          });
          if (!response.ok) {
            console.error(
              '[contact] webhook responded',
              response.status,
              await response.text().catch(() => ''),
            );
            return jsonResponse(
              { error: 'Failed to deliver message. Please try again later.' },
              502,
            );
          }
        } catch (err) {
          console.error('[contact] webhook fetch failed', err);
          return jsonResponse(
            { error: 'Failed to deliver message. Please try again later.' },
            502,
          );
        }

        return jsonResponse({ ok: true });
      },
    },
  },
});
