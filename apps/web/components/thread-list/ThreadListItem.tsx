'use client';
import { ThreadDto } from '@web/service/thread';
import React, { FC, useCallback, useState } from 'react';
import { motion } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Ellipsis } from 'lucide-react';
import { cn } from '@web/lib/utils';

export interface ThreadListItemProps {
  thread: ThreadDto;
}
const ThreadListItem: FC<ThreadListItemProps> = ({ thread }) => {
  const [open, setOpen] = useState(false);

  const onClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  }, []);

  return (
    <motion.div
      className={cn(
        'rounded-lg px-3 py-2 hover:bg-gray-100',
        open && 'bg-gray-100',
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex cursor-pointer items-center justify-between">
        <div className="text-sm">{thread.title || '未命名'}</div>

        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild onClick={onClick}>
            <Ellipsis className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-30">
            <DropdownMenuItem>
              <span className="text-red-500">删除</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default ThreadListItem;
