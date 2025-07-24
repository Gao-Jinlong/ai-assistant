'use client';

import ThreadContent from '@web/components/thread-content';
import ThreadDefault from '@web/components/thread-default';
import ThreadInput from '@web/components/thread-input';
import { useSSEMessages } from '@web/hooks/useSSEMessages';
import useBoundStore from '@web/store';
import { useCallback, useEffect } from 'react';
import service from '@web/service';
import { useMutation, useQuery } from '@tanstack/react-query';

export default function ChatPage() {
  const thread = useBoundStore((state) => state.currentThread);
  const sendMessage = useBoundStore((state) => state.sendMessage);
  const appendMessage = useBoundStore((state) => state.appendMessage);
  const setIsResponding = useBoundStore((state) => state.setIsResponding);
  const setCurrentThread = useBoundStore((state) => state.setCurrentThread);
  const loginInfo = useBoundStore((state) => state.loginInfo);

  const { sendMessage: sendMessageSSE } = useSSEMessages({
    onMessage: appendMessage,
    onLoadingChange: setIsResponding,
  });
  // TODO: 用 https://github.com/lukemorales/query-key-factory 管理 queryKey
  const threadQuery = useQuery({
    queryKey: ['thread'],
    queryFn: service.thread.getThreads,
  });
  const createThread = useMutation({
    mutationFn: service.thread.createThread,
    onSuccess: (resp) => {
      setCurrentThread(resp.data);
    },
  });

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!thread) {
        if (!loginInfo?.user?.id) return;
        const res = await createThread.mutateAsync();
        threadQuery.refetch();
        if (!res?.data) {
          return;
        }
      }
      sendMessage(message);
      sendMessageSSE(message);
    },
    [
      thread,
      sendMessage,
      sendMessageSSE,
      loginInfo?.user?.id,
      createThread,
      threadQuery,
    ],
  );

  return (
    <div className="flex h-screen w-full flex-1 flex-col">
      <div className="flex w-full flex-1 overflow-hidden">
        {thread ? <ThreadContent /> : <ThreadDefault />}
      </div>
      <div className="flex w-full overflow-hidden p-8">
        <ThreadInput thread={thread} onSend={handleSendMessage} />
      </div>
    </div>
  );
}
