import { env } from '~/env';

/**
 * Verify a reCAPTCHA v3 token against Google's siteverify endpoint. v3 returns
 * a score in [0, 1]; we reject low-scoring (likely bot) requests. Returns true
 * only when the token is valid, the action matches what the client claimed, and
 * the score clears the threshold.
 */
const RECAPTCHA_MIN_SCORE = 0.5;

export async function verifyRecaptchaToken(
  token: string | undefined,
  expectedAction: string,
  ip?: string,
): Promise<boolean> {
  if (!token) return false;
  try {
    const params = new URLSearchParams({
      secret: env.RECAPTCHA_SECRET_KEY,
      response: token,
    });
    if (ip && ip !== 'unknown') params.set('remoteip', ip);

    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    if (!res.ok) return false;

    const data = (await res.json()) as {
      success?: boolean;
      score?: number;
      action?: string;
    };
    return (
      data.success === true &&
      data.action === expectedAction &&
      (data.score ?? 0) >= RECAPTCHA_MIN_SCORE
    );
  } catch (err) {
    console.error('[recaptcha] verify failed', err);
    return false;
  }
}
