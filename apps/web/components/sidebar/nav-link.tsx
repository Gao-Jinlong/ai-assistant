'use client';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';

import { cn } from '@web/lib/utils';
import React from 'react';
import { NotificationDot } from '../ui/notification-dot';
import { navigationIcons, RouterItem } from '@web/store/router';
export interface NavItem extends RouterItem {
  disabled?: boolean;
}

const NavLink = ({
  isSimple,
  item,
  isActive,
}: {
  isSimple: boolean;
  item: NavItem;
  isActive: boolean;
}) => {
  const t = useTranslations();
  const Icon = navigationIcons[item.key];

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
      <NotificationDot show={!!item.badge} count={item.badge}>
        <Icon className="h-4 w-4 flex-shrink-0" />
      </NotificationDot>

      <AnimatePresence>
        {!isSimple && (
          <motion.span
            className="flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {t(item.label)}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
};

export default NavLink;
