import { createFileRoute, useRouter } from '@tanstack/react-router';
import { AlertCircleIcon, MailIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Spinner } from '~/components/ui/spinner';
import { useAuthActions } from '~/lib/auth/provider';
import type { SignInError } from '~/lib/constants';
import {
  parseSignInError,
  SIGN_IN_ERROR_MESSAGES
} from '~/lib/constants';
import { safeInternalPath } from '~/lib/redirect';
import googleIcon from './../../images/google-logo.svg';

interface SignInSearch {
  to?: string;
  error?: SignInError;
}

export const Route = createFileRoute('/(auth)/sign-in')({
  validateSearch: (search: Record<string, unknown>): SignInSearch => ({
    to: safeInternalPath(search.to) ?? undefined,
    error: parseSignInError(search.error),
  }),
  component: SignInPage,
});

function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const { to, error } = Route.useSearch();
  const redirectTo = to ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  async function handleGoogle() {
    setOauthLoading(true);
    try {
      const result = await signIn('google', { redirectTo });
      if (result.redirect) {
        window.location.href = result.redirect.toString();
      }
    } catch (err) {
      console.error('Google sign-in failed', err);
      toast.error(
        err instanceof Error
          ? err.message
          : 'Google sign-in failed. Check that AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET are set on the Convex deployment.',
      );
      setOauthLoading(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center px-6 py-40">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Sign in to eBoto</h1>
          <p className="text-sm text-muted-foreground">
            We'll email you a magic link.
          </p>
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Sign-in failed</AlertTitle>
            <AlertDescription>
              {SIGN_IN_ERROR_MESSAGES[error]}
            </AlertDescription>
          </Alert>
        ) : null}
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            try {
              const result = await signIn('ses', { email, redirectTo });
              if (result.signingIn) {
                await router.invalidate();
              }
              toast.success('Check your inbox for the magic link.');
            } catch (err) {
              toast.error('Failed to send magic link.');
              console.error(err);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Spinner /> : <MailIcon />}{' '}
            {submitting ? 'Sending…' : 'Send magic link'}
          </Button>
        </form>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={oauthLoading}
        >
          <img src={googleIcon} alt="Google" className="size-4" />{' '}
          {oauthLoading ? 'Redirecting…' : 'Continue with Google'}
        </Button>
      </div>
    </main>
  );
}
