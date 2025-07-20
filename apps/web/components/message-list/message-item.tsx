import { cn } from '@web/lib/utils';
import { MessageDto } from '@web/service/thread';
import { cva } from 'class-variance-authority';

export interface MessageItemProps {
  message: MessageDto;
}

const messageItemVariants = cva('flex gap-2', {
  variants: {
    role: {
      user: 'text-right',
      ai: 'text-left',
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
          message.role === 'user' && 'bg-secondary',
        )}
      >
        {message.content}
      </div>
    </div>
  );
};

export default MessageItem;
