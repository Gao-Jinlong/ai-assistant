'use client';

import useBoundStore from '@web/store';
import MessageList from '../message-list';
import { useMemo } from 'react';
import { useStickToBottom } from 'use-stick-to-bottom';

const ThreadContent = () => {
  const messages = useBoundStore((state) => state.messages);
  const messagesList = useMemo(() => Array.from(messages.values()), [messages]);

  const { scrollRef, contentRef } = useStickToBottom();

  return (
    <div
      className="flex w-full justify-center overflow-auto pt-12"
      ref={scrollRef}
    >
      <div ref={contentRef} className="flex h-max max-w-4xl flex-1 flex-col">
        <MessageList messages={messagesList} />
      </div>
    </div>
  );
};

export default ThreadContent;
