'use client';

import { ReactNode, createContext, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initTrpc, trpc, trpcClient } from '@web/app/trpc';
import { useLocale } from 'next-intl';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export const TRPCContext = createContext<{
  client: typeof trpc;
} | null>(null);

// TODO 全局错误处理
export function TrpcProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5分钟后数据过期
            retry: 3, // 失败时最多重试3次
            refetchOnWindowFocus: false, // 窗口聚焦时不自动重新获取
          },
          mutations: {
            onError: (error) => {
              console.error('Mutation error:', error);
            },
          },
        },
      }),
  );
  const [client] = useState(() => initTrpc());

  return (
    <trpcClient.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <TRPCContext.Provider value={{ client: trpc }}>
          {children}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </TRPCContext.Provider>
      </QueryClientProvider>
    </trpcClient.Provider>
  );
}
export default trpc.withTRPC(TrpcProvider);
