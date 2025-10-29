'use client';

import useBoundStore from '@web/store';
import MessageList from '../message-list';
import { useQuery } from '@tanstack/react-query';
import queries from '@web/queries';
import { useMemo } from 'react';
import { useStickToBottom } from 'use-stick-to-bottom';

const ThreadContent = () => {
  const thread = useBoundStore((state) => state.currentThread)!;
  const messages = useBoundStore((state) => state.messages);
  const messagesList = useMemo(() => Array.from(messages.values()), [messages]);

  const { scrollRef, contentRef } = useStickToBottom();

  // TODO 点击历史记录时回显历史消息
  useQuery({
    ...queries.thread.getThreadMessages(thread.id),
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      // setMessageList(data.data);
    },
  });

  // TODO 修复滚动问题
  return (
    <div className="overflow-auto" ref={scrollRef}>
      <div ref={contentRef} className="flex h-full flex-1 flex-col">
        <MessageList messages={messagesList} />
        {/* {messagesList.map((message) => {
          if (message.type === MESSAGE_TYPE.MESSAGE_CHUNK) {
            return message.data.content;
          }
          return null;
        })} */}
      </div>
    </div>
  );
};

export default ThreadContent;
