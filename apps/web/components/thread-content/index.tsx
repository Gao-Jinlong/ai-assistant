import useBoundStore from '@web/store';
import MessageList from '../message-list';

const ThreadContent = () => {
  const thread = useBoundStore((state) => state.currentThread);

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      {thread && <MessageList thread={thread} />}
    </div>
  );
};

export default ThreadContent;
