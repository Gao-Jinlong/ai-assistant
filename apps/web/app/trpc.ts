'use client';

import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@server/trpc/trpc.router';
import { getUserPayload } from '@web/contexts/auth-context';
import { createTRPCNext } from '@trpc/next';
import { createTRPCReact } from '@trpc/react-query';

export const trpc = createTRPCNext<AppRouter>({
  config(opts) {
    return {
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_NESTJS_SERVER}/api`,
          async headers() {
            const userPayload = getUserPayload();
            if (userPayload?.token?.access_token) {
              return {
                Authorization: `Bearer ${userPayload.token.access_token}`,
              };
            }
            return {};
          },
        }),
      ],
    };
  },
});

export const trpcClient = createTRPCReact<AppRouter>();

export function initTrpc() {
  return trpcClient.createClient({
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_NESTJS_SERVER}/api`,
        async headers() {
          const userPayload = getUserPayload();
          if (userPayload?.token?.access_token) {
            return {
              Authorization: `Bearer ${userPayload.token.access_token}`,
            };
          }
          return {};
        },
      }),
    ],
  });
}
