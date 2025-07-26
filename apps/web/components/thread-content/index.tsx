import useBoundStore from '@web/store';
import MessageList from '../message-list';
import { useQuery } from '@tanstack/react-query';
import queries from '@web/queries';

const ThreadContent = () => {
  const thread = useBoundStore((state) => state.currentThread)!;
  const messageList = useBoundStore((state) => state.messageList);
  const setMessageList = useBoundStore((state) => state.setMessageList);

  useQuery({
    ...queries.thread.getThreadMessages(thread.id),
    onSuccess: (data) => {
      setMessageList(data.data);
    },
  });
  return (
    <div className="flex h-full w-full flex-1 flex-col">
      {thread && <MessageList messages={messageList} />}
    </div>
  );
};

export default ThreadContent;
