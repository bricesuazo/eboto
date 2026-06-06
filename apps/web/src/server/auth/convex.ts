import { ConvexHttpClient } from 'convex/browser';
import type { FunctionReference } from 'convex/server';

import { env } from '~/env';

function setup(token?: string) {
  const client = new ConvexHttpClient(env.VITE_CONVEX_URL);
  if (token) client.setAuth(token);
  return client;
}

export async function fetchAction<Action extends FunctionReference<'action'>>(
  action: Action | string,
  args?: Record<string, unknown>,
  options?: { token?: string },
): Promise<unknown> {
  const client = setup(options?.token);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client.action(action as any, (args ?? {}) as any);
}

export async function fetchQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  args?: Record<string, unknown>,
  options?: { token?: string },
): Promise<unknown> {
  const client = setup(options?.token);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client.query(query as any, (args ?? {}) as any);
}
