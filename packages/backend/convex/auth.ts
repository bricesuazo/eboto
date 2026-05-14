import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import Google from '@auth/core/providers/google';
import { convexAuth } from '@convex-dev/auth/server';
import { Email } from '@convex-dev/auth/providers/Email';

/**
 * Custom magic-link provider sending via AWS SES v2 — same channel as the
 * voter lifecycle blasts. We don't use Resend so production has a single
 * email vendor and SES sandbox/production parity covers both flows.
 *
 * Honors:
 *   - `SES_FROM_EMAIL` — full From: line. Defaults to the no-reply address.
 *   - `AUTH_FROM_EMAIL` — override just for auth (optional).
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
    const from =
      process.env.AUTH_FROM_EMAIL ??
      process.env.SES_FROM_EMAIL ??
      'eBoto <no-reply@eboto.app>';
    const ses = new SESv2Client({ region });
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
