import MessageItem from './message-item';
import type { SSEMessage } from '@server/chat/dto/sse-message.dto';

export interface MessageListProps {
  messages: SSEMessage[];
}
const MessageList = ({ messages }: MessageListProps) => {
  return (
    <div className="flex h-full w-full max-w-4xl flex-col gap-4 p-8">
      {messages.map((message, index) => (
        <MessageItem
          key={`${index}-${message.metadata?.groupId}`}
          message={message}
        />
      ))}
    </div>
  );
};

export default MessageList;
