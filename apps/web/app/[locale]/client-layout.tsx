'use client';

import { Toaster } from '@web/components/ui/sonner';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SimpleSidebar from '@web/components/sidebar/simple-sidebar';

const queryClient = new QueryClient();

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* 侧边栏 */}
      <div className="flex h-screen w-screen">
        <SimpleSidebar />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>

      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
