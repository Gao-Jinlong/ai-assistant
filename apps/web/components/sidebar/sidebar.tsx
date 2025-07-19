'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@web/i18n/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import { Button } from '@web/components/ui/button';
import {
  Settings,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@web/lib/utils';
import useBoundStore from '@web/store';
import Brand from '../brand';
import { motion } from 'motion/react';
import ThreadList from '../thread-list';
import Navigation from './navigation';

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

const Sidebar = ({ onCollapsedChange }: SidebarProps) => {
  const t = useTranslations();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const user = useBoundStore((state) => state.loginInfo?.user);

  const toggleCollapsed = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

  return (
    <div
      className={cn(
        'bg-card text-card-foreground flex h-full flex-col overflow-hidden whitespace-nowrap border-r transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* 品牌区域 */}
      <div className="flex h-14 items-center border-b px-4">
        <Brand isSimple={isCollapsed} />
      </div>

      {/* 主导航区域 */}
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden py-4">
        <Navigation isSimple={isCollapsed} />

        {/* 分隔线 */}
        <div className="my-4 border-t" />

        <ThreadList isSimple={isCollapsed} />
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
};

export default Sidebar;
