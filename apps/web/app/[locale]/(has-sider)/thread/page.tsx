'use client';
import ThreadContent from '@web/components/thread-content';
import ThreadDefault from '@web/components/thread-default';
import ThreadInput from '@web/components/thread-input';
import useBoundStore from '@web/store';
import { threadService } from '@web/service';
import { useMutation, useQuery } from '@tanstack/react-query';
import queries from '@web/queries';
import { toast } from 'sonner';
import { sendMessage } from '@web/store/currentThread';
import { useEventCallback } from 'usehooks-ts';

export default function ChatPage() {
  const thread = useBoundStore((state) => state.currentThread);
  const setCurrentThread = useBoundStore((state) => state.setCurrentThread);

  const threadQuery = useQuery(queries.thread.getThreads);
  const createThread = useMutation({
    mutationFn: threadService.createThread,
    onSuccess: (resp) => {
      setCurrentThread(resp.data);
    },
  });

  const handleSendMessage = useEventCallback(async (message: string) => {
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
  });

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
