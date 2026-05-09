import { useState } from 'react';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useAuthActions } from '~/lib/auth/provider';

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SignInPage,
});

function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  async function handleGoogle() {
    setOauthLoading(true);
    try {
      const result = await signIn('google', { redirectTo: '/dashboard' });
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
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Sign in to eBoto</h1>
          <p className="text-muted-foreground text-sm">
            We'll email you a magic link.
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            try {
              const result = await signIn('resend', { email });
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
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send magic link'}
          </Button>
        </form>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={oauthLoading}
        >
          {oauthLoading ? 'Redirecting…' : 'Continue with Google'}
        </Button>
      </div>
    </main>
  );
}
