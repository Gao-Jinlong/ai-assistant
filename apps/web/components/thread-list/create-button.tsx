'use client';

import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';

export const CreateButton = ({ isSimple }: { isSimple: boolean }) => {
  const t = useTranslations();
  return (
    <Button
      size={isSimple ? 'sm' : 'default'}
      variant="default"
      className="w-full transition-all duration-300"
    >
      <Plus />
      <AnimatePresence>
        {!isSimple ? (
          <motion.span
            initial={{
              opacity: 0,
              width: 0,
            }}
            animate={{
              opacity: 1,
              width: 'auto',
            }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {t('thread.newThread')}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </Button>
  );
};
