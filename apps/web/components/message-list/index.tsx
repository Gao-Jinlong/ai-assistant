import { MessageDto } from '@web/service/thread';
import MessageItem from './message-item';
import { cn } from '@web/lib/utils';

export interface MessageListProps {
  messages: MessageDto[];
}
const MessageList = ({ messages }: MessageListProps) => {
  return (
    <div className="flex h-full w-full max-w-4xl flex-col gap-4 p-8">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn('flex', message.role === 'user' && 'justify-end')}
        >
          <MessageItem message={message} />
        </div>
      ))}
    </div>
  );
};

export default MessageList;
