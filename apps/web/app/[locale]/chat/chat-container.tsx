'use client';

import { useRef } from 'react';
import { Button } from '@web/components/ui/button';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ChatWindow, { MessageType } from '@web/components/chat-window';
import SenderInput from '@web/components/sender';
import { GetRef } from 'antd';
import { Sender } from '@ant-design/x';

interface ChatContainerProps {
  messages: MessageType[];
  isSending: boolean;
  onSend: (text: string) => Promise<void>;
  onOpenSidebar: () => void;
}

export function ChatContainer({
  messages,
  isSending,
  onSend,
  onOpenSidebar,
}: ChatContainerProps) {
  const t = useTranslations('chat');
  const senderRef = useRef<GetRef<typeof Sender>>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center overflow-hidden">
      {/* 顶部栏 */}
      <div className="flex w-full items-center border-b bg-white p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSidebar}
          className="mr-2 md:hidden"
        >
          <Menu size={20} />
        </Button>
        <h1 className="font-semibold">{t('chatTitle')}</h1>
      </div>

      {/* 聊天窗口 */}
      <div className="w-full flex-1 overflow-hidden p-4">
        <ChatWindow messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <SenderInput
        className="mb-12 w-1/2 rounded-lg border border-gray-200 bg-white p-4"
        onSend={onSend}
        placeholder={t('typeMessage', {
          defaultValue: 'Type a message...',
        })}
        ref={senderRef}
        disabled={isSending}
        isLoading={isSending}
      />
    </div>
  );
}
