'use client';

import ThreadContent from '@web/components/thread-content';
import ThreadDefault from '@web/components/thread-default';
import ThreadInput from '@web/components/thread-input';
import { useSSEMessages } from '@web/hooks/useSSEMessages';
import useBoundStore from '@web/store';
import { useCallback } from 'react';
import { threadService } from '@web/service';
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
    mutationFn: threadService.createThread,
    onSuccess: (resp) => {
      setCurrentThread(resp.data);
    },
  });

  const handleSendMessage = useCallback(
    async (message: string) => {
      try {
        let currentThread = thread;
        if (!currentThread) {
          const res = await createThread.mutateAsync();
          threadQuery.refetch();
          if (!res?.data) {
            throw new Error('创建会话失败');
          }
          currentThread = res.data;
        }
        if (!currentThread?.uid) {
          throw new Error('会话不存在');
        }
        sendMessage(message);
        // TODO 切换到对话中的会话时恢复接收消息
        sendMessageSSE(currentThread.uid, message);
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
