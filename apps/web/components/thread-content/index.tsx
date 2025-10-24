import useBoundStore from '@web/store';
import MessageList from '../message-list';
import { useQuery } from '@tanstack/react-query';
import queries from '@web/queries';
import { useRef, useEffect, useCallback, useState } from 'react';

const ThreadContent = () => {
  const thread = useBoundStore((state) => state.currentThread)!;
  const messageList = useBoundStore((state) => state.messageList);
  const _setMessageList = useBoundStore((state) => state.setMessageList);

  const messageListContainer = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const lastMessageCountRef = useRef(0);
  const lastMessageContentRef = useRef('');

  // 检查是否在底部
  const isAtBottom = useCallback(() => {
    if (!messageListContainer.current) return true;
    const { scrollTop, scrollHeight, clientHeight } =
      messageListContainer.current;
    return scrollHeight - scrollTop - clientHeight < 50; // 50px 的容差
  }, []);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (messageListContainer.current) {
      // 使用 setTimeout 确保 DOM 更新完成后再滚动
      setTimeout(() => {
        if (messageListContainer.current) {
          messageListContainer.current.scrollTo({
            top: messageListContainer.current.scrollHeight,
            behavior: 'instant',
          });
        }
      }, 0);
    }
  }, []);

  // 监听消息列表变化，自动滚动到底部
  useEffect(() => {
    const currentMessageCount = messageList.length;
    const lastMessage = messageList[messageList.length - 1];
    const currentLastMessageContent =
      lastMessage?.data?.content.toString() || '';

    // 检查是否有新消息或最后一条消息内容有变化
    const hasNewMessage = currentMessageCount > lastMessageCountRef.current;
    const hasContentUpdate =
      currentLastMessageContent !== lastMessageContentRef.current;

    if (
      (hasNewMessage || hasContentUpdate) &&
      shouldAutoScroll &&
      !isUserScrolling
    ) {
      scrollToBottom();
    }

    // 更新引用值
    lastMessageCountRef.current = currentMessageCount;
    lastMessageContentRef.current = currentLastMessageContent;
  }, [messageList, shouldAutoScroll, isUserScrolling, scrollToBottom]);

  // 监听用户滚动事件
  const handleScroll = useCallback(() => {
    if (!messageListContainer.current) return;

    const atBottom = isAtBottom();

    if (atBottom) {
      setShouldAutoScroll(true);
      setIsUserScrolling(false);
    } else {
      setShouldAutoScroll(false);
      setIsUserScrolling(true);
    }
  }, [isAtBottom]);

  // 添加一个额外的 useEffect 来处理消息内容变化时的滚动
  useEffect(() => {
    // 当消息列表变化时，如果用户没有主动滚动，则自动滚动到底部
    if (shouldAutoScroll && !isUserScrolling && messageList.length > 0) {
      // 使用 requestAnimationFrame 确保在下一个渲染周期执行
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messageList, shouldAutoScroll, isUserScrolling, scrollToBottom]);

  // 添加滚动事件监听器
  useEffect(() => {
    const container = messageListContainer.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // TODO 点击历史记录时回显历史消息
  useQuery({
    ...queries.thread.getThreadMessages(thread.id),
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      // setMessageList(data.data);
    },
  });

  return (
    <div
      className="flex h-full w-full flex-1 flex-col items-center justify-center overflow-auto"
      ref={messageListContainer}
    >
      {thread && <MessageList messages={messageList} />}
    </div>
  );
};

export default ThreadContent;
