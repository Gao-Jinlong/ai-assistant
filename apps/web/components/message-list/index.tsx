import { MESSAGE_TYPE } from '@server/chat/chat.interface';
import MessageItem from './message-item';
import type { StreamMessage } from '@server/chat/dto/sse-message.dto';

export interface MessageListProps {
  messages: StreamMessage[];
}
const MessageList = ({ messages }: MessageListProps) => {
  return (
    <>
      {messages.map((message) => {
        if (message.type === MESSAGE_TYPE.MESSAGE_CHUNK) {
          return <MessageItem key={message.id} messageId={message.id} />;
        }
        return null;
      })}
    </>
  );
};

export default MessageList;
