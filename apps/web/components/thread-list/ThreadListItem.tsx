'use client';
import { ThreadVO } from '@web/service/thread';
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
  thread: ThreadVO;
  isActive: boolean;
  onDelete: (thread: ThreadVO) => void;
  onClick: (thread: ThreadVO) => void;
}
const ThreadListItem: FC<ThreadListItemProps> = ({
  thread,
  isActive,
  onDelete,
  onClick,
}) => {
  const [open, setOpen] = useState(false);

  const handleClick = useCallback(() => {
    onClick(thread);
  }, [onClick, thread]);

  const handleDelete = useCallback(() => {
    onDelete(thread);
  }, [onDelete, thread]);

  return (
    <motion.div
      layout
      layoutId={`thread-list-item-${thread.id}`}
      className={cn(
        'cursor-pointer rounded-lg px-3 py-2 hover:bg-gray-100',
        (open || isActive) && 'bg-gray-100',
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      exit={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm">{thread.title || '未命名'}</div>

        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Ellipsis className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-30">
            <DropdownMenuItem onClick={handleDelete}>
              <span className="text-red-500">删除</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default ThreadListItem;
