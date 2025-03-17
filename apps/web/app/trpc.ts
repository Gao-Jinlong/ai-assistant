'use client';

import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@server/trpc/trpc.router';
import { getUserPayload } from '@web/contexts/auth-context';

export const trpc = createTRPCReact<AppRouter>();

export function initTrpc() {
  return trpc.createClient({
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
