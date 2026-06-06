import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { AlertCircleIcon, MailIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { Spinner } from '~/components/ui/spinner';
import { useAuthActions } from '~/lib/auth/provider';
import type { SignInError } from '~/lib/constants';
import { parseSignInError, SIGN_IN_ERROR_MESSAGES } from '~/lib/constants';
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

const signInSchema = z.object({
  email: z.email('Enter a valid email'),
});

type SignInFormValues = z.infer<typeof signInSchema>;

function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const { to, error } = Route.useSearch();
  const redirectTo = to ?? '/dashboard';
  const [oauthLoading, setOauthLoading] = useState(false);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '' },
  });

  const submitting = form.formState.isSubmitting;

  async function onSubmit(values: SignInFormValues) {
    try {
      const result = await signIn('ses', {
        email: values.email,
        redirectTo,
      });
      if (result.signingIn) {
        await router.invalidate();
      }
      toast.success('Check your inbox for the magic link.');
      form.reset();
    } catch (err) {
      toast.error('Failed to send magic link.');
      console.error(err);
    }
  }

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
            <AlertDescription>{SIGN_IN_ERROR_MESSAGES[error]}</AlertDescription>
          </Alert>
        ) : null}
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Spinner /> : <MailIcon />}{' '}
              {submitting ? 'Sending…' : 'Send magic link'}
            </Button>
          </form>
        </Form>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border" aria-hidden />
          <p className="text-sm font-semibold text-muted-foreground uppercase">
            or
          </p>
          <div className="h-px flex-1 bg-border" aria-hidden />
        </div>

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
