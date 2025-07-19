'use client';

import { Toaster } from '@web/components/ui/sonner';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SimpleSidebar from '@web/components/sidebar/sidebar';
import useRouterMatch from '@web/hooks/router';

const queryClient = new QueryClient();

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 设置路由
  useRouterMatch();

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
