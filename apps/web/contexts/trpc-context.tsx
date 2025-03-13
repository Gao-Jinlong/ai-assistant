'use client';

import { ReactNode, createContext, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, initTrpc } from '@web/app/trpc';

export const TRPCContext = createContext<{
  client: typeof trpc;
} | null>(null);

export function TrpcProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => initTrpc());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <TRPCContext.Provider value={{ client: trpc }}>
          {children}
        </TRPCContext.Provider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
