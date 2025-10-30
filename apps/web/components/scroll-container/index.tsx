// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { useStickToBottom } from 'use-stick-to-bottom';

import { ScrollArea } from '@web/components/ui/scroll-area';
import { cn } from '@web/lib/utils';

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
  scrollShadowColor = 'var(--background)',
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
              'absolute left-0 right-0 top-0 z-10 h-10 bg-gradient-to-t',
              `from-transparent to-[var(--scroll-shadow-color)]`,
            )}
            style={
              {
                '--scroll-shadow-color': scrollShadowColor,
              } as React.CSSProperties
            }
          ></div>
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 z-10 h-10 bg-gradient-to-b',
              `from-transparent to-[var(--scroll-shadow-color)]`,
            )}
            style={
              {
                '--scroll-shadow-color': scrollShadowColor,
              } as React.CSSProperties
            }
          ></div>
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
