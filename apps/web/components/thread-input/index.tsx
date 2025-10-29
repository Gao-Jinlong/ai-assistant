'use client';

import React, { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '../ui/button';
import { SendHorizontal } from 'lucide-react';
import useBoundStore from '@web/store';
import { Textarea } from '../ui/textarea';
import { motion } from 'motion/react';
import { ThreadVO } from '@web/service/thread';

export interface ThreadInputProps {
  thread: ThreadVO | null;
  onSend: (message: string) => void;
}
const ThreadInput = ({ thread, onSend }: ThreadInputProps) => {
  const [input, setInput] = useState('');
  const t = useTranslations('thread');
  const isResponding = useBoundStore((state) => state.responding);

  const onChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (e) => {
      setInput(e.target.value);
    },
    [setInput],
  );

  const handleSend = useCallback(() => {
    onSend(input);
    setInput('');
  }, [input, onSend]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> =
    useCallback(
      (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      },
      [handleSend],
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white p-4 shadow transition-shadow focus-within:shadow-md"
    >
      <Textarea
        name="input"
        placeholder={t('input.placeholder')}
        className="w-full resize-none border-none shadow-none outline-none focus:outline-none focus-visible:ring-0"
        value={input}
        onChange={onChange}
        onKeyDown={handleKeyDown}
      />
      <div className="flex items-center justify-end">
        <Button
          variant="default"
          size="icon"
          className="flex items-center justify-center rounded-full"
          onClick={handleSend}
          disabled={isResponding}
        >
          {isResponding ? (
            <div className="flex h-3 w-3 items-center justify-center rounded-sm bg-white"></div>
          ) : (
            <SendHorizontal />
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default ThreadInput;
