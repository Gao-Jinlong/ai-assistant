'use client';

import { ReactNode, createContext, useCallback, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initTrpc, trpc, trpcClient } from '@web/app/trpc';
import { useLocale } from 'next-intl';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TRPCClientError } from '@trpc/client';
import { AppRouter } from '@server/trpc/trpc.router';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
export const TRPCContext = createContext<{
  client: typeof trpc;
} | null>(null);

// TODO 全局错误处理
export function TrpcProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const router = useRouter();

  const handleError = useCallback(
    (error: TRPCClientError<AppRouter>) => {
      if (error instanceof TRPCClientError) {
        const shape = error.shape;
        if (shape?.code === 401) {
          toast.error(shape.message);
          router.push('/login');
        }
      }
    },
    [router],
  );

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5分钟后数据过期
            retry: false, // 失败时最多重试3次
            refetchOnWindowFocus: false, // 窗口聚焦时不自动重新获取
            onError: (error) => {
              if (error instanceof TRPCClientError) {
                handleError(error);
              }
            },
          },
          mutations: {
            onError: (error) => {
              if (error instanceof TRPCClientError) {
                handleError(error);
              }
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
