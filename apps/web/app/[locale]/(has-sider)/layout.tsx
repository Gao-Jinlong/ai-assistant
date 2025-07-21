import SimpleSidebar from '@web/components/sidebar/sidebar';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-1">
      <SimpleSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
