import { createServerFn } from '@tanstack/react-start';

import {
  exchangeCode,
  fetchCurrentUserWithToken,
  getValidAuthToken,
} from '~/server/auth';

export const getServerAuth = createServerFn({ method: 'GET' }).handler(
  async () => {
    const token = await getValidAuthToken();
    if (!token) {
      return {
        token: null as string | null,
        user: null,
        timeFetched: Date.now(),
      };
    }
    const user = await fetchCurrentUserWithToken(token);
    return { token, user, timeFetched: Date.now() };
  },
);

export const exchangeCodeServerFn = createServerFn({ method: 'POST' })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data }) => {
    return await exchangeCode(data.code);
  });
