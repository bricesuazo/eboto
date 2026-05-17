'use node';

import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { v } from 'convex/values';

import { internalAction } from './_generated/server';

export const sendMagicLink = internalAction({
  args: { email: v.string(), url: v.string() },
  handler: async (_ctx, { email, url }) => {
    const region = process.env.AWS_REGION ?? 'ap-southeast-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set',
      );
    }

    const from = process.env.SES_FROM_EMAIL ?? 'eBoto <no-reply@eboto.app>';
    const ses = new SESv2Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
    const subject = 'Sign in to eBoto';
    const text = `Sign in to eBoto: ${url}`;
    const html = `<p>Click the link below to sign in to eBoto. This link will expire shortly.</p><p><a href="${url}">${url}</a></p><p>If you didn't request this, you can ignore this email.</p>`;
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: from,
        Destination: { ToAddresses: [email] },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Text: { Data: text, Charset: 'UTF-8' },
              Html: { Data: html, Charset: 'UTF-8' },
            },
          },
        },
      }),
    );
  },
});
