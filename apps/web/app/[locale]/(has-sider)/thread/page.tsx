'use client';

import ThreadContent from '@web/components/thread-content';
import ThreadDefault from '@web/components/thread-default';
import ThreadInput from '@web/components/thread-input';
import { useSSEMessages } from '@web/hooks/useSSEMessages';
import useBoundStore from '@web/store';
import { useCallback, useEffect } from 'react';
import service from '@web/service';

export default function ChatPage() {
  const thread = useBoundStore((state) => state.currentThread);
  const sendMessage = useBoundStore((state) => state.sendMessage);
  const appendMessage = useBoundStore((state) => state.appendMessage);
  const setIsResponding = useBoundStore((state) => state.setIsResponding);
  const setCurrentThread = useBoundStore((state) => state.setCurrentThread);
  const loginInfo = useBoundStore((state) => state.loginInfo);

  const { sendMessage: sendMessageSSE, disconnect } = useSSEMessages({
    onMessage: appendMessage,
    onLoadingChange: setIsResponding,
  });

  const handleSendMessage = useCallback(
    async (message: string) => {
      let current = thread;
      if (!current) {
        // 获取 userId
        const userId = loginInfo?.user?.id;
        if (!userId) return;
        // 创建新会话
        const res = await service.thread.createThread();
        if (res?.data) {
          setCurrentThread(res.data);
          current = res.data;
        } else {
          return;
        }
      }
      sendMessage(message);
      sendMessageSSE(message);
    },
    [thread, sendMessage, sendMessageSSE, loginInfo, setCurrentThread],
  );

  return (
    <div className="flex h-screen w-full flex-1 flex-col">
      <div className="flex w-full flex-1 overflow-hidden">
        {thread ? <ThreadContent /> : <ThreadDefault />}
      </div>
      <div className="flex w-full overflow-hidden p-8">
        <ThreadInput thread={thread} onSend={handleSendMessage} />
      </div>
    </div>
  );
}
