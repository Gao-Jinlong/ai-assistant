'use client';

import ThreadContent from '@web/components/thread-content';
import ThreadDefault from '@web/components/thread-default';
import ThreadInput from '@web/components/thread-input';
import { useSSEMessages } from '@web/hooks/useSSEMessages';
import useBoundStore from '@web/store';
import { useCallback } from 'react';
import service from '@web/service';
import { useMutation, useQuery } from '@tanstack/react-query';
import queries from '@web/queries';
import { toast } from 'sonner';

export default function ChatPage() {
  const thread = useBoundStore((state) => state.currentThread);
  const sendMessage = useBoundStore((state) => state.sendMessage);
  const appendMessage = useBoundStore((state) => state.appendMessage);
  const setIsResponding = useBoundStore((state) => state.setIsResponding);
  const setCurrentThread = useBoundStore((state) => state.setCurrentThread);

  const { sendMessage: sendMessageSSE } = useSSEMessages({
    onMessage: appendMessage,
    onLoadingChange: setIsResponding,
  });
  const threadQuery = useQuery(queries.thread.getThreads);
  const createThread = useMutation({
    mutationFn: service.thread.createThread,
    onSuccess: (resp) => {
      setCurrentThread(resp.data);
    },
  });

  const handleSendMessage = useCallback(
    async (message: string) => {
      try {
        if (!thread) {
          const res = await createThread.mutateAsync();
          threadQuery.refetch();
          if (!res?.data) {
            return;
          }
        }
        sendMessage(message);
        // TODO 切换到对话中的会话时恢复接收消息
        sendMessageSSE(message);
      } catch (error) {
        console.error(error);
        if (createThread.isError) {
          console.log('🚀 ~ ChatPage ~ createThread:', createThread.error);
        } else if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('发送失败');
        }
      }
    },
    [thread, sendMessage, sendMessageSSE, createThread, threadQuery],
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
