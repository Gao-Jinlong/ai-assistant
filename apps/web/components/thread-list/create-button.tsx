'use client';

import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

export interface CreateButtonProps {
  isSimple: boolean;
  onClick?: () => void;
}
export const CreateButton = ({ isSimple, onClick }: CreateButtonProps) => {
  const t = useTranslations();

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <Button
      size={isSimple ? 'sm' : 'default'}
      variant="default"
      className="w-full transition-all duration-300"
      onClick={handleClick}
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
