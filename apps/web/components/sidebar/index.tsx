'use client';

import * as React from 'react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@web/i18n/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import { Button } from '@web/components/ui/button';
import { Separator } from '@web/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@web/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@web/components/ui/dropdown-menu';
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

    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          'hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:text-foreground',
          item.disabled && 'pointer-events-none opacity-50',
        )}
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

    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              {t(item.label)}
              {item.badge && (
                <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {item.badge}
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return linkContent;
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
        {!isCollapsed ? (
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
            <span className="text-lg">{t('brand.name')}</span>
          </Link>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center"
                >
                  <Image
                    src="https://ginlon-bucket-01.oss-cn-shanghai.aliyuncs.com/favicon.svg"
                    alt="logo"
                    width={20}
                    height={20}
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{t('brand.name')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
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

        <Separator className="my-4" />

        <nav className="space-y-1 px-3">
          {bottomNavigation.map((item) => (
            <NavLink key={item.key} item={item} />
          ))}
        </nav>
      </div>

      {/* 用户信息区域 */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'h-auto w-full justify-start gap-3 p-2',
                isCollapsed && 'justify-center',
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={mockUser.avatar || ''} />
                <AvatarFallback>{mockUser.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-1 flex-col items-start text-left">
                  <p className="text-sm font-medium">{mockUser.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {mockUser.role}
                  </p>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={isCollapsed ? 'center' : 'start'}
            side={isCollapsed ? 'right' : 'top'}
            className="w-56"
          >
            <div className="flex items-center gap-2 p-2">
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
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('sidebar.profile')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {t('sidebar.notifications')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t('sidebar.settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              {t('sidebar.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 折叠按钮 */}
      <div className="border-t p-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCollapsed}
                className={cn(
                  'h-8 w-full',
                  isCollapsed ? 'justify-center' : 'justify-end',
                )}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isCollapsed ? 'right' : 'top'}>
              {isCollapsed ? '展开侧边栏' : '收起侧边栏'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
