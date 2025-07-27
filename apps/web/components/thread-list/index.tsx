'use client';
import useBoundStore from '@web/store';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useMemo } from 'react';
import { CreateButton } from './create-button';
import { useQuery } from '@tanstack/react-query';
import ThreadListItem from './ThreadListItem';
import { deleteThread, ThreadDto } from '@web/service/thread';
import queries from '@web/queries';

const ThreadList = ({ isSimple }: { isSimple: boolean }) => {
  const router = useBoundStore((state) => state.router);

  const currentThread = useBoundStore((state) => state.currentThread);
  const setThreads = useBoundStore((state) => state.setThreads);
  const setCurrentThread = useBoundStore((state) => state.setCurrentThread);
  const clearCurrent = useBoundStore((state) => state.clearCurrent);
  const threads = useBoundStore((state) => state.threads);
  const isThread = useMemo(() => router.key === 'thread', [router]);
  const threadQuery = useQuery({
    ...queries.thread.getThreads,
    onSuccess: (resp) => {
      setThreads(resp.data);
    },
  });

  const onClick = useCallback(
    async (thread: ThreadDto) => {
      setCurrentThread(thread);
    },
    [setCurrentThread],
  );
  const onDelete = useCallback(
    async (thread: ThreadDto) => {
      await deleteThread(thread.id);
      threadQuery.refetch();
    },
    [threadQuery],
  );

  const handleCreate = useCallback(() => {
    clearCurrent();
  }, [clearCurrent]);

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

          <div className="scrollbar-hide flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
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
