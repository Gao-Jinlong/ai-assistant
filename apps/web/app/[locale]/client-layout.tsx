'use client';

import { AuthProvider } from '@web/contexts/auth-context';
import { TrpcProvider } from '@web/contexts/trpc-context';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TrpcProvider>
      <AuthProvider>{children}</AuthProvider>
    </TrpcProvider>
  );
}
