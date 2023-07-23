import { authOptions } from '@/lib/auth';
import type { inferAsyncReturnType } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { getServerSession } from 'next-auth';

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(
  opts:
    | {
        type: 'rsc';
      }
    | (FetchCreateContextFnOptions & {
        type: 'api';
      }),
) {
  return {
    type: opts.type,
    session: await getServerSession(authOptions),
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
