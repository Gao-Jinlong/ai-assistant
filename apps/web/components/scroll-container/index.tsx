// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { useStickToBottom } from 'use-stick-to-bottom';

import { ScrollArea } from '@web/components/ui/scroll-area';
import { cn } from '@web/lib/utils';
import { AnimatePresence, motion } from 'motion/react';

export interface ScrollContainerProps {
  className?: string;
  contentClassName?: string;
  children?: ReactNode;
  scrollShadow?: boolean;
  scrollShadowColor?: string;
  autoScrollToBottom?: boolean;
  ref?: RefObject<ScrollContainerRef | null>;
}

export interface ScrollContainerRef {
  scrollToBottom(): void;
}

export function ScrollContainer({
  className,
  children,
  scrollShadow = true,
  scrollShadowColor = 'var(--color-gray-50)',
  autoScrollToBottom = false,
  ref,
}: ScrollContainerProps) {
  const { scrollRef, contentRef, scrollToBottom, isAtBottom } =
    useStickToBottom({
      initial: 'instant',
    });
  useImperativeHandle(ref, () => {
    return {
      scrollToBottom() {
        if (isAtBottom) {
          scrollToBottom();
        }
      },
    };
  });

  const tempScrollRef = useRef<HTMLElement>(null);
  const tempContentRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!autoScrollToBottom) {
      tempScrollRef.current = scrollRef.current;
      tempContentRef.current = contentRef.current;
      scrollRef.current = null;
      contentRef.current = null;
    } else if (tempScrollRef.current && tempContentRef.current) {
      scrollRef.current = tempScrollRef.current;
      contentRef.current = tempContentRef.current;
    }
  }, [autoScrollToBottom, contentRef, scrollRef]);

  return (
    <div className={cn('relative', className)}>
      {scrollShadow && (
        <>
          <div
            className={cn(
              'absolute top-0 right-0 left-0 z-10 h-10 bg-linear-to-t',
              `from-transparent to-(--scroll-shadow-color)`,
            )}
            style={
              {
                '--scroll-shadow-color': scrollShadowColor,
              } as React.CSSProperties
            }
          ></div>
          <AnimatePresence>
            {!isAtBottom && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={cn(
                    'absolute right-0 bottom-0 left-0 z-10 h-10 bg-linear-to-b',
                    `from-transparent to-(--scroll-shadow-color)`,
                  )}
                  style={
                    {
                      '--scroll-shadow-color': scrollShadowColor,
                    } as React.CSSProperties
                  }
                ></div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      <ScrollArea ref={scrollRef} className="w-full">
        <div className={cn('h- flex w-full justify-center')} ref={contentRef}>
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}
