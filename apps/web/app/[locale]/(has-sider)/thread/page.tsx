'use client';
import ThreadContent from '@web/components/thread-content';
import ThreadDefault from '@web/components/thread-default';
import ThreadInput from '@web/components/thread-input';
import useBoundStore from '@web/store';
import { threadService } from '@web/service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import queries from '@web/queries';
import { toast } from 'sonner';
import { sendMessage, setActiveThread } from '@web/store/active-thread';
import { useEventCallback } from 'usehooks-ts';
import { ThreadVO } from '@web/service/thread';
import { AnimatePresence, motion } from 'motion/react';

export default function ChatPage() {
  const thread = useBoundStore((state) => state.activeThread);
  const queryClient = useQueryClient();

  const createThread = useMutation({
    mutationFn: threadService.createThread,
  });

  const handleSendMessage = useEventCallback(async (message: string) => {
    try {
      let currentThread = thread;
      if (!currentThread) {
        const res = await createThread.mutateAsync();
        queryClient.invalidateQueries({
          queryKey: queries.thread.getThreads.queryKey,
        });
        if (!res?.data) {
          throw new Error('创建会话失败');
        }
        currentThread = res.data;
        await setActiveThread(currentThread);
      }
      if (!currentThread?.uid) {
        throw new Error('会话不存在');
      }
      await sendMessage(message);
    } catch (error) {
      console.error(error);
      if (createThread.isError) {
        console.log('create thread error:', createThread.error);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('发送失败');
      }
    }
  });

  return (
    <div className="flex h-screen w-full flex-1 flex-col">
      <div className="relative flex w-full flex-1 overflow-hidden pt-12">
        <AnimatePresence mode="wait">
          {thread ? (
            <motion.div
              className="absolute inset-0 flex h-full w-full flex-1 flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ThreadContent />
            </motion.div>
          ) : (
            <motion.div
              className="absolute inset-0 flex h-full w-full flex-1 flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              key="thread-default"
            >
              <ThreadDefault />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex w-full overflow-hidden p-8">
        <ThreadInput thread={thread} onSend={handleSendMessage} />
      </div>
    </div>
  );
}
