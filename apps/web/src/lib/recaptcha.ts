import { env } from '~/env';

/**
 * Minimal reCAPTCHA v3 client helper.
 *
 * Loads Google's reCAPTCHA script on demand (the first time a token is
 * requested) and returns a token for the given action. The token is sent to
 * the server, which verifies it against Google's siteverify endpoint. No UI
 * is rendered — v3 runs invisibly and scores the request.
 */

interface Grecaptcha {
  ready: (cb: () => void) => void;
  execute: (siteKey: string, opts: { action: string }) => Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

const SITE_KEY = env.VITE_RECAPTCHA_SITE_KEY;
const SCRIPT_SRC = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;

let scriptPromise: Promise<Grecaptcha> | null = null;

function loadScript(): Promise<Grecaptcha> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<Grecaptcha>((resolve, reject) => {
    if (window.grecaptcha) {
      resolve(window.grecaptcha);
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.grecaptcha) {
        resolve(window.grecaptcha);
      } else {
        reject(new Error('reCAPTCHA failed to initialize'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
    document.head.appendChild(script);
  }).catch((err) => {
    // Allow a later retry if loading failed.
    scriptPromise = null;
    throw err;
  });

  return scriptPromise;
}

/** Execute reCAPTCHA v3 for the given action and resolve with a token. */
export async function getRecaptchaToken(action: string): Promise<string> {
  const grecaptcha = await loadScript();
  return new Promise<string>((resolve, reject) => {
    grecaptcha.ready(() => {
      grecaptcha.execute(SITE_KEY, { action }).then(resolve, reject);
    });
  });
}
