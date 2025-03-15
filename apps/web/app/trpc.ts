'use client';

import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@server/trpc/trpc.router';

export const trpc = createTRPCReact<AppRouter>();

export function initTrpc() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_NESTJS_SERVER}/api`,
      }),
    ],
  });
}
