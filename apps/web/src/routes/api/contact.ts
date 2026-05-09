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
