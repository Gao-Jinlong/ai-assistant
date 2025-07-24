'use client';
import useBoundStore from '@web/store';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo } from 'react';
import { CreateButton } from './create-button';
import { useQuery } from '@tanstack/react-query';
import service from '@web/service';
import ThreadListItem from './ThreadListItem';
import { deleteThread, ThreadDto } from '@web/service/thread';

const ThreadList = ({ isSimple }: { isSimple: boolean }) => {
  const router = useBoundStore((state) => state.router);
  const setThreads = useBoundStore((state) => state.setThreads);
  const threads = useBoundStore((state) => state.threads);
  const isThread = useMemo(() => router.key === 'thread', [router]);
  const threadQuery = useQuery({
    queryKey: ['thread'],
    queryFn: service.thread.getThreads,
    onSuccess: (resp) => {
      setThreads(resp.data);
    },
  });

  const onDelete = useCallback(
    async (thread: ThreadDto) => {
      await deleteThread(thread.id);
      threadQuery.refetch();
    },
    [threadQuery],
  );

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
          className="flex h-full flex-1 flex-col gap-4 overflow-hidden"
        >
          <div className="flex px-4">
            <CreateButton isSimple={isSimple} />
          </div>

          <div className="scrollbar-hide flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden px-4">
            {!isSimple && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full flex-1 flex-col gap-2 px-4"
              >
                {threads.map((thread) => (
                  <ThreadListItem
                    key={thread.id}
                    thread={thread}
                    onDelete={onDelete}
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
