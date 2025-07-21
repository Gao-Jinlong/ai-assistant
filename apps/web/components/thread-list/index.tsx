'use client';
import useBoundStore from '@web/store';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo } from 'react';
import { CreateButton } from './create-button';
import { useQuery } from '@tanstack/react-query';
import service from '@web/service';

const ThreadList = ({ isSimple }: { isSimple: boolean }) => {
  const router = useBoundStore((state) => state.router);
  const setThreads = useBoundStore((state) => state.setThreads);
  const threads = useBoundStore((state) => state.threads);
  const isThread = useMemo(() => router.key === 'thread', [router]);
  const threadQuery = useQuery({
    queryKey: ['thread'],
    queryFn: () => service.thread.getThreads(),
  });

  useEffect(() => {
    if (threadQuery.data) {
      setThreads(threadQuery.data.data);
    }
  }, [threadQuery.data, setThreads]);

  return (
    <AnimatePresence>
      {isThread ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex h-full flex-1 flex-col gap-4"
        >
          <div className="flex px-4">
            <CreateButton isSimple={isSimple} />
          </div>

          <div className="flex h-full flex-1 flex-col gap-2 px-4">
            {threads.map((thread) => (
              <div key={thread.id}>{thread.uid}</div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default ThreadList;
