'use client';

import useBoundStore from '@web/store';
import MessageList from '../message-list';
import MessageSkeleton from '../message-skeleton';
import { useEffect, useMemo, useRef } from 'react';
import { ScrollContainer, ScrollContainerRef } from '../scroll-container';
import { AnimatePresence, motion } from 'motion/react';

const ThreadContent = () => {
  const messages = useBoundStore((state) => state.messages);
  const loading = useBoundStore((state) => state.loading);
  const messagesList = useMemo(() => Array.from(messages.values()), [messages]);
  const scrollContainerRef = useRef<ScrollContainerRef | null>(null);

  return (
    <div className="flex h-full w-full justify-center">
      <AnimatePresence>
        {loading ? (
          <motion.div
            className="w-full max-w-4xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MessageSkeleton />
          </motion.div>
        ) : (
          <ScrollContainer
            className="flex w-full max-w-4xl"
            autoScrollToBottom
            ref={scrollContainerRef}
          >
            <div className="w-full">
              <MessageList messages={messagesList} />
            </div>
          </ScrollContainer>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThreadContent;
