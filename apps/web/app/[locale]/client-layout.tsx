'use client';

import { Toaster } from '@web/components/ui/sonner';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-screen">{children}</div>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
