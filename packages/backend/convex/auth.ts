import Google from '@auth/core/providers/google';
import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { Email } from '@convex-dev/auth/providers/Email';
import { convexAuth } from '@convex-dev/auth/server';

/**
 * Custom magic-link provider sending via AWS SES v2 — same channel as the
 * voter lifecycle blasts. We don't use Resend so production has a single
 * email vendor and SES sandbox/production parity covers both flows.
 *
 * Honors:
 *   - `SES_FROM_EMAIL` — full From: line. Defaults to the no-reply address.
 *   - `AWS_REGION` — SES region (defaults to us-east-1).
 *   - AWS credentials picked up automatically from env / IAM.
 */
const SesEmail = Email({
  id: 'ses',
  async sendVerificationRequest({
    identifier: email,
    url,
  }: {
    identifier: string;
    url: string;
  }) {
    const region = process.env.AWS_REGION ?? 'us-east-1';
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

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google, SesEmail],
});
