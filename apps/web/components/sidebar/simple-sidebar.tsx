'use client';

import * as React from 'react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@web/i18n/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import { Button } from '@web/components/ui/button';
import {
  Home,
  Settings,
  HelpCircle,
  FileText,
  MessageSquare,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@web/lib/utils';
import Image from 'next/image';
import useBoundStore from '@web/store';
import Brand from '../brand';
import { motion } from 'motion/react';
import { Badge } from '../ui/badge';
interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  disabled?: boolean;
}

const navigation: NavItem[] = [
  {
    key: 'dashboard',
    label: 'sidebar.dashboard',
    icon: Home,
    href: '/dashboard',
  },
  // {
  //   key: 'projects',
  //   label: 'sidebar.projects',
  //   icon: Folder,
  //   href: '/projects',
  //   badge: 3,
  // },
  // {
  //   key: 'tasks',
  //   label: 'sidebar.tasks',
  //   icon: CheckSquare,
  //   href: '/tasks',
  //   badge: 12,
  // },
  // {
  //   key: 'team',
  //   label: 'sidebar.team',
  //   icon: Users,
  //   href: '/team',
  // },
  // {
  //   key: 'analytics',
  //   label: 'sidebar.analytics',
  //   icon: BarChart3,
  //   href: '/analytics',
  // },
  // {
  //   key: 'calendar',
  //   label: 'sidebar.calendar',
  //   icon: Calendar,
  //   href: '/calendar',
  // },
  // {
  //   key: 'files',
  //   label: 'sidebar.files',
  //   icon: FolderOpen,
  //   href: '/files',
  // },
  {
    key: 'chat',
    label: 'sidebar.chat',
    icon: MessageSquare,
    href: '/chat',
    badge: 5,
  },
];

const bottomNavigation: NavItem[] = [
  {
    key: 'documentation',
    label: 'sidebar.documentation',
    icon: FileText,
    href: '/docs',
  },
  {
    key: 'help',
    label: 'sidebar.help',
    icon: HelpCircle,
    href: '/help',
  },
  {
    key: 'settings',
    label: 'sidebar.settings',
    icon: Settings,
    href: '/settings',
  },
];

export default function Sidebar({ onCollapsedChange }: SidebarProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const user = useBoundStore((state) => state.loginInfo?.user);

  const toggleCollapsed = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

  const isActiveRoute = (href: string) => {
    return pathname === href;
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = isActiveRoute(item.href);

    return (
      <Link
        href={item.href}
        className={cn(
          'hover:bg-accent hover:text-accent-foreground flex h-9 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:text-foreground',
          item.disabled && 'pointer-events-none opacity-50',
        )}
        title={t(item.label)}
      >
        <div className="relative">
          <item.icon className="h-4 w-4 flex-shrink-0" />

          <motion.div
            initial={{ opacity: 0, width: 0, height: 0 }}
            animate={{
              opacity: isCollapsed && item.badge ? 1 : 0,
              width: isCollapsed && item.badge ? 8 : 0,
              height: isCollapsed && item.badge ? 8 : 0,
            }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="absolute -right-1 -top-1 flex items-center justify-center rounded-full bg-red-500"
          ></motion.div>
        </div>

        {!isCollapsed && (
          <>
            <motion.span
              className="flex-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: isCollapsed ? 0 : 1 }}
              transition={{ duration: 0.3 }}
            >
              {t(item.label)}
            </motion.span>
            {item.badge && <Badge className="ml-auto">{item.badge}</Badge>}
          </>
        )}
      </Link>
    );
  };

  return (
    <div
      className={cn(
        'bg-card text-card-foreground flex h-full flex-col overflow-hidden whitespace-nowrap border-r transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* 品牌区域 */}
      <div className="flex h-14 items-center border-b px-4">
        <Brand isCollapsed={isCollapsed} />
      </div>

      {/* 主导航区域 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        <nav className="space-y-1 px-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          >
            {
              <div className="px-3 py-2">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  {t('sidebar.navigation')}
                </p>
              </div>
            }
          </motion.div>

          {navigation.map((item) => (
            <NavLink key={item.key} item={item} />
          ))}
        </nav>

        {/* 分隔线 */}
        <div className="my-4 border-t" />

        <nav className="space-y-1 px-3">
          {bottomNavigation.map((item) => (
            <NavLink key={item.key} item={item} />
          ))}
        </nav>
      </div>

      {/* 用户信息区域 */}
      <div className="border-t p-4">
        <div className="relative">
          <Button
            variant="ghost"
            className={cn('h-4 w-full justify-start gap-3 p-2')}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.avatar || ''} />
              <AvatarFallback>{user?.name.slice(0, 2) || ''}</AvatarFallback>
            </Avatar>

            <motion.div
              initial={{ opacity: 0, display: 'none' }}
              animate={{ opacity: isCollapsed ? 0 : 1, display: 'block' }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm font-medium">{user?.name || ''}</p>
            </motion.div>
          </Button>

          {/* 用户菜单 */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div
                className={cn(
                  'bg-popover text-popover-foreground absolute z-50 min-w-[12rem] rounded-md border p-1 shadow-md',
                  isCollapsed
                    ? 'bottom-full right-0 mb-2'
                    : 'bottom-full left-0 mb-2',
                )}
              >
                <div className="flex items-center gap-2 border-b p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || ''} />
                    <AvatarFallback>
                      {user?.name.slice(0, 2) || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{user?.name || ''}</p>
                    <p className="text-muted-foreground text-xs">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>

                <Link
                  href="/profile"
                  className="hover:bg-accent flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="h-4 w-4" />
                  {t('sidebar.profile')}
                </Link>

                <Link
                  href="/notifications"
                  className="hover:bg-accent flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Bell className="h-4 w-4" />
                  {t('sidebar.notifications')}
                </Link>

                <Link
                  href="/settings"
                  className="hover:bg-accent flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-4 w-4" />
                  {t('sidebar.settings')}
                </Link>

                <div className="my-1 border-t" />

                <button
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-600"
                  onClick={() => {
                    setShowUserMenu(false);
                    // 这里可以添加登出逻辑
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  {t('sidebar.logout')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 折叠按钮 */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className={cn(
            'h-8 w-full',
            isCollapsed ? 'justify-center' : 'justify-end',
          )}
          title={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
