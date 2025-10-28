import { Store } from '.';
import { Home, MessageSquare } from 'lucide-react';
import React from 'react';

export interface RouterItem {
  key: string;
  label: string;
  href: string;
  badge?: number;
  disabled?: boolean;
}
export const navigation: RouterItem[] = [
  {
    key: 'thread',
    label: 'sidebar.thread',
    href: '/thread',
    badge: 5,
    disabled: false,
  },
  {
    key: 'dashboard',
    label: 'sidebar.dashboard',
    href: '/dashboard',
    disabled: false,
  },
];
export const navigationIcons: Record<
  (typeof navigation)[number]['key'],
  React.ComponentType<{ className?: string }>
> = {
  dashboard: Home,
  thread: MessageSquare,
};
export interface RouterStore {
  router: RouterItem;
  navigation: RouterItem[];
  setRouter: (router: RouterItem) => void;
}

const createRouterSlice: Store<RouterStore> = (set) => ({
  router: navigation[0],
  navigation,
  setRouter: (router: RouterItem) => set({ router }),
});

export { createRouterSlice };
