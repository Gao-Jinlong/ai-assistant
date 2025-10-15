import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseTypewriterEffectOptions {
  /** 打字速度，毫秒 */
  speed?: number;
  /** 是否启用逐字效果 */
  enabled?: boolean;
  /** 是否在内容变化时重新开始打字 */
  restartOnChange?: boolean;
}

export interface UseTypewriterEffectReturn {
  /** 当前显示的内容 */
  displayedContent: string;
  /** 是否正在打字 */
  isTyping: boolean;
  /** 手动开始打字 */
  startTyping: () => void;
  /** 手动停止打字 */
  stopTyping: () => void;
  /** 立即显示全部内容 */
  showAll: () => void;
}

/**
 * 逐字显示效果的Hook
 * @param content 要显示的内容
 * @param options 配置选项
 */
export const useTypewriterEffect = (
  content: string,
  options: UseTypewriterEffectOptions = {},
): UseTypewriterEffectReturn => {
  const {
    speed = 30, // 默认30ms每个字符
    enabled = true,
    restartOnChange = true,
  } = options;

  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(0);
  const contentRef = useRef(content);

  // 清理定时器
  const clearInterval = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 开始打字
  const startTyping = useCallback(() => {
    if (!enabled || !content) {
      setDisplayedContent(content);
      setIsTyping(false);
      return;
    }

    clearInterval();
    setIsTyping(true);
    currentIndexRef.current = 0;
    setDisplayedContent('');

    const typeNextChar = () => {
      if (currentIndexRef.current < content.length) {
        setDisplayedContent(content.slice(0, currentIndexRef.current + 1));
        currentIndexRef.current++;
        intervalRef.current = setTimeout(typeNextChar, speed);
      } else {
        setIsTyping(false);
        clearInterval();
      }
    };

    typeNextChar();
  }, [content, enabled, speed, clearInterval]);

  // 停止打字
  const stopTyping = useCallback(() => {
    clearInterval();
    setIsTyping(false);
  }, [clearInterval]);

  // 立即显示全部内容
  const showAll = useCallback(() => {
    clearInterval();
    setDisplayedContent(content);
    setIsTyping(false);
    currentIndexRef.current = content.length;
  }, [content, clearInterval]);

  // 当内容变化时重新开始打字
  useEffect(() => {
    if (restartOnChange && content !== contentRef.current) {
      const previousContent = contentRef.current;
      contentRef.current = content;

      // 如果新内容比之前的内容长，说明是增量更新
      if (
        content.length > previousContent.length &&
        content.startsWith(previousContent)
      ) {
        // 对于增量更新，从当前位置继续打字
        currentIndexRef.current = previousContent.length;
        if (enabled) {
          startTyping();
        }
      } else {
        // 对于全新内容，重新开始
        startTyping();
      }
    }
  }, [content, restartOnChange, startTyping, enabled]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearInterval();
    };
  }, [clearInterval]);

  return {
    displayedContent,
    isTyping,
    startTyping,
    stopTyping,
    showAll,
  };
};
