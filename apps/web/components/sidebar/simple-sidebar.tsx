'use client';

import * as React from 'react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@web/i18n/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import { Button } from '@web/components/ui/button';
import {
  Home,
  Folder,
  CheckSquare,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  FileText,
  Calendar,
  FolderOpen,
  MessageSquare,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@web/lib/utils';
import Image from 'next/image';

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
  {
    key: 'projects',
    label: 'sidebar.projects',
    icon: Folder,
    href: '/projects',
    badge: 3,
  },
  {
    key: 'tasks',
    label: 'sidebar.tasks',
    icon: CheckSquare,
    href: '/tasks',
    badge: 12,
  },
  {
    key: 'team',
    label: 'sidebar.team',
    icon: Users,
    href: '/team',
  },
  {
    key: 'analytics',
    label: 'sidebar.analytics',
    icon: BarChart3,
    href: '/analytics',
  },
  {
    key: 'calendar',
    label: 'sidebar.calendar',
    icon: Calendar,
    href: '/calendar',
  },
  {
    key: 'files',
    label: 'sidebar.files',
    icon: FolderOpen,
    href: '/files',
  },
  {
    key: 'messages',
    label: 'sidebar.messages',
    icon: MessageSquare,
    href: '/messages',
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

// 模拟用户数据
const mockUser = {
  name: '张三',
  email: 'zhangsan@example.com',
  avatar: null,
  role: '管理员',
};

export default function Sidebar({ onCollapsedChange }: SidebarProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
          'hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:text-foreground',
          item.disabled && 'pointer-events-none opacity-50',
        )}
        title={isCollapsed ? t(item.label) : undefined}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span className="flex-1">{t(item.label)}</span>
            {item.badge && (
              <span className="bg-primary text-primary-foreground ml-auto rounded-full px-2 py-0.5 text-xs">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <div
      className={cn(
        'bg-card text-card-foreground flex h-full flex-col border-r transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* 品牌区域 */}
      <div className="flex h-14 items-center border-b px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <Image
            src="https://ginlon-bucket-01.oss-cn-shanghai.aliyuncs.com/favicon.svg"
            alt="logo"
            width={20}
            height={20}
            className="flex-shrink-0"
          />
          {!isCollapsed && <span className="text-lg">{t('brand.name')}</span>}
        </Link>
      </div>

      {/* 主导航区域 */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {!isCollapsed && (
            <div className="px-3 py-2">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                {t('sidebar.navigation')}
              </p>
            </div>
          )}

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
            className={cn(
              'h-auto w-full justify-start gap-3 p-2',
              isCollapsed && 'justify-center',
            )}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={mockUser.avatar || ''} />
              <AvatarFallback>{mockUser.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-1 flex-col items-start text-left">
                <p className="text-sm font-medium">{mockUser.name}</p>
                <p className="text-muted-foreground text-xs">{mockUser.role}</p>
              </div>
            )}
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
                    <AvatarImage src={mockUser.avatar || ''} />
                    <AvatarFallback>{mockUser.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{mockUser.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {mockUser.email}
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
