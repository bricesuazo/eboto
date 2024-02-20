import { z } from "zod";

import { env } from "../env.mjs";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const systemRouter = createTRPCRouter({
  sendMessage: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        message: z.string(),
        subject: z.string(),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input }) => {
      const embed = {
        title: "📩 New message from eboto.app",
        description: `>>> ${input.message.toString().trim()}`,
        color: 5759645,
        fields: [
          {
            name: "📨 Subject",
            value: `\`\`\`${input.subject.trim()}\`\`\``,
            inline: true,
          },
          {
            name: "🧑‍🦱 Name",
            value: `\`\`\`${input.name ? input.name.trim() : "n/a"}\`\`\``,
            inline: true,
          },
          {
            name: "📨 Email",
            value: `\`\`\`${input.email.trim()}\`\`\``,
            inline: true,
          },
        ],
      };

      await fetch(`${env.DISCORD_WEBHOOK_URL}?wait=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatar_url: "https://bricesuazo.com/favicon.ico",
          embeds: [embed],
        }),
      });
    }),
});
