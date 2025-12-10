'use client';
import useBoundStore from '@web/store';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo } from 'react';
import { CreateButton } from './create-button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ThreadListItem from './ThreadListItem';
import { deleteThread, getThreadMessages, ThreadVO } from '@web/service/thread';
import queries from '@web/queries';
import { toast } from 'sonner';
import { setActiveThread } from '@web/store/active-thread';

const ThreadList = ({ isSimple }: { isSimple: boolean }) => {
  const router = useBoundStore((state) => state.router);

  const currentThread = useBoundStore((state) => state.activeThread);
  const setThreads = useBoundStore((state) => state.setThreads);
  const clearActiveThread = useBoundStore((state) => state.clearActiveThread);
  const threads = useBoundStore((state) => state.threads);
  const isThread = useMemo(() => router.key === 'thread', [router]);

  const queryClient = useQueryClient();
  const threadsQuery = useQuery({
    ...queries.thread.getThreads,
  });

  useEffect(() => {
    if (threadsQuery.data) {
      setThreads(threadsQuery.data.data);
    }
  }, [threadsQuery.data, setThreads]);

  // TODO: 点击时调用接口查询 thread 状态，决定是否调用 restoreThread 接口
  const onClick = useCallback(
    async (thread: ThreadVO) => {
      try {
        await setActiveThread(thread);
      } catch (error) {
        console.error('Failed to load thread messages:', error);
        toast.error('加载历史消息失败');
      }
    },
    [clearActiveThread],
  );

  const deleteMutation = useMutation({
    mutationFn: deleteThread,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queries.thread.getThreads.queryKey,
      });
    },
  });

  const onDelete = useCallback(
    (thread: ThreadVO) => {
      deleteMutation.mutate(thread.id);
    },
    [deleteMutation],
  );

  const handleCreate = useCallback(() => {
    clearActiveThread();
  }, [clearActiveThread]);

  return (
    <AnimatePresence>
      {isThread ? (
        <motion.div
          layout
          layoutId="thread-list"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex h-full flex-1 flex-col gap-4 overflow-hidden px-4"
        >
          <div className="flex">
            <CreateButton isSimple={isSimple} onClick={handleCreate} />
          </div>

          <div className="scrollbar-hide flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {!isSimple && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full flex-1 flex-col gap-1"
              >
                {threads.map((thread) => (
                  <ThreadListItem
                    key={thread.id}
                    isActive={currentThread?.id === thread.id}
                    thread={thread}
                    onDelete={onDelete}
                    onClick={onClick}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default ThreadList;
