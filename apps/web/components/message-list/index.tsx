import { MessageChunkDto } from '@web/service/thread';
import MessageItem from './message-item';

export interface MessageListProps {
  messages: MessageChunkDto[];
}
const MessageList = ({ messages }: MessageListProps) => {
  return (
    <div className="flex h-full w-full max-w-4xl flex-col gap-4 p-8">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
};

export default MessageList;
