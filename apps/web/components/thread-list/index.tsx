'use client';
import useBoundStore from '@web/store';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CreateButton } from './create-button';

const ThreadList = ({ isSimple }: { isSimple: boolean }) => {
  const router = useBoundStore((state) => state.router);
  const isThread = useMemo(() => router.key === 'thread', [router]);
  const t = useTranslations();

  return (
    <AnimatePresence>
      {isThread ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex h-full flex-1 px-4">
            <CreateButton isSimple={isSimple} />
          </div>

          <div className="flex h-full flex-1 px-4"></div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default ThreadList;
