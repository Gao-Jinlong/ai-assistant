'use client';

import useBoundStore from '@web/store';
import MessageList from '../message-list';
import { useMemo, useRef } from 'react';
import { ScrollContainer, ScrollContainerRef } from '../scroll-container';

const ThreadContent = () => {
  const messages = useBoundStore((state) => state.messages);
  const messagesList = useMemo(() => Array.from(messages.values()), [messages]);
  const scrollContainerRef = useRef<ScrollContainerRef | null>(null);

  return (
    <ScrollContainer
      className="flex h-full w-full justify-center"
      autoScrollToBottom
      ref={scrollContainerRef}
    >
      <div className="w-full max-w-4xl">
        <MessageList messages={messagesList} />
      </div>
    </ScrollContainer>
  );
};

export default ThreadContent;
