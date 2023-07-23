import type { inferAsyncReturnType } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { getSession } from 'next-auth/react';

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(
  opts:
    | {
        type: 'api_server';
      }
    | (FetchCreateContextFnOptions & {
        type: 'api';
      }),
) {
  return {
    type: opts.type,
    session: await getSession(),
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
