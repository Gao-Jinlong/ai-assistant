import { cn } from '@web/lib/utils';
import { MessageChunkDto } from '@web/service/thread';
import { cva } from 'class-variance-authority';
import { memo } from 'react';

export interface MessageItemProps {
  message: MessageChunkDto;
}

const messageItemVariants = cva('flex gap-2', {
  variants: {
    role: {
      user: 'justify-end',
      assistant: 'text-left',
    },
  },
  defaultVariants: {
    role: 'user',
  },
});

const MessageItem = ({ message }: MessageItemProps) => {
  return (
    <div className={messageItemVariants({ role: message.role })}>
      <div
        className={cn(
          'w-auto rounded-md p-4',
          message.role === 'user' ? 'bg-secondary' : 'justify-start text-left',
        )}
      >
        {message.data.content}
      </div>
    </div>
  );
};

export default memo(MessageItem);
