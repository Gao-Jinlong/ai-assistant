import useBoundStore from '@web/store';
import MessageList from '../message-list';

const ThreadContent = () => {
  const thread = useBoundStore((state) => state.currentThread);
  const messageList = useBoundStore((state) => state.messageList);

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      {thread && <MessageList messages={messageList} />}
    </div>
  );
};

export default ThreadContent;
