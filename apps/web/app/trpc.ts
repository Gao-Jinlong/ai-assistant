'use client';

import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@server/trpc/trpc.router';

export const trpc = createTRPCReact<AppRouter>();

export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // 浏览器应该使用相对路径
    return '';
  }
  // 服务端请求应该使用绝对路径
  return process.env.NEXT_PUBLIC_NESTJS_SERVER;
}
export function initTrpc() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/trpc`,
      }),
    ],
  });
}
