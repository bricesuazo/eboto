'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Alert,
  Anchor,
  Button,
  Divider,
  Paper,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAt, IconCheck } from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import Balancer from 'react-wrap-balancer';

import type { Auth } from '~/schema/auth';
import { AuthSchema } from '~/schema/auth';
import { createClient } from '~/supabase/client';

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [loadings, setLoadings] = useState<{
    google: boolean;
    credential: boolean;
  }>({
    google: false,
    credential: false,
  });

  const form = useForm<Auth>({
    initialValues: {
      email: '',
      // password: "",
    },
    validate: zod4Resolver(AuthSchema),
  });

  return (
    <Paper radius="md" p="xl" withBorder shadow="md">
      <Stack>
        <Stack gap="xs">
          <Text ta="center">
            <Balancer ratio={0.4} preferNative={false}>
              Welcome to eBoto, register with
            </Balancer>
          </Text>
          <Button
            radius="xl"
            onClick={async () => {
              const supabase = createClient();
              setLoadings((loadings) => ({ ...loadings, google: true }));

              const next = searchParams.get('next');

              await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${location.origin}/api/auth/callback${
                    next ? `?next=${next}` : ''
                  }`,
                },
              });
            }}
            loading={loadings.google}
            disabled={loadings.credential}
            leftSection={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid"
                viewBox="0 0 256 262"
                style={{ width: '0.9rem', height: '0.9rem' }}
              >
                <path
                  fill="#4285F4"
                  d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                />
                <path
                  fill="#34A853"
                  d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                />
                <path
                  fill="#FBBC05"
                  d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                />
                <path
                  fill="#EB4335"
                  d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                />
              </svg>
            }
            variant="default"
          >
            Google
          </Button>
        </Stack>
        {!isEmailSent ? (
          <>
            <Divider label="Or continue with email" labelPosition="center" />

            <form
              onSubmit={form.onSubmit((values) => {
                const supabase = createClient();
                setLoadings((loadings) => ({ ...loadings, credential: true }));

                void (async () => {
                  await supabase.auth.signInWithOtp({
                    email: values.email,
                    options: {
                      emailRedirectTo: searchParams.get('next') ?? '/dashboard',
                    },
                  });

                  setLoadings((loadings) => ({
                    ...loadings,
                    credential: false,
                  }));
                  setIsEmailSent(true);
                })();
              })}
            >
              <Stack>
                <TextInput
                  placeholder="Enter your email address"
                  type="email"
                  withAsterisk
                  label="Email"
                  required
                  {...form.getInputProps('email')}
                  leftSection={<IconAt size="1rem" />}
                  disabled={loadings.credential || loadings.google}
                />

                {/* {error && (
                <Alert
                  leftSection={<IconAlertCircle size="1rem" />}
                  title="Error"
                  color="red"
                >
                  {error}
                </Alert>
              )} */}
                <Button
                  type="submit"
                  loading={loadings.credential}
                  disabled={!form.isValid('email')}
                >
                  Send magic link
                </Button>
              </Stack>
            </form>
          </>
        ) : (
          <Alert title="Success" icon={<IconCheck />}>
            A magic link has been sent to your email address.
          </Alert>
        )}
        <Text size="sm" ta="center">
          By registering, you agree to our{' '}
          <Anchor component={Link} href="/terms" target="_blank">
            Terms of Service
          </Anchor>{' '}
          and{' '}
          <Anchor component={Link} href="/privacy" target="_blank">
            Privacy Policy
          </Anchor>
          .
        </Text>
      </Stack>
    </Paper>
  );
}
