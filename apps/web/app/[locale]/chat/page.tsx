'use client';

import { useState, useEffect } from 'react';
import { MessageType } from '@web/components/chat-window';
import { useTranslations, useLocale } from 'next-intl';
import { Skeleton } from '@web/components/ui/skeleton';
import { ConversationSidebar } from '@web/app/[locale]/chat/conversation-sidebar';
import { ChatContainer } from '@web/app/[locale]/chat/chat-container';
import { useConversation } from './context';
export default function ChatPage() {
  const t = useTranslations('chat');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { query } = useConversation();

  useEffect(() => {}, []);

  if (query.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-4 p-4">
        <div className="flex h-full flex-1 flex-col justify-start space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="flex h-full flex-[6] flex-col justify-between space-y-4">
          <Skeleton className="h-full w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const handleNewChat = () => {};
  const handleSend = () => {};

  return (
    <div className="flex flex-1 bg-gray-50">
      <ConversationSidebar
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={() => setIsSidebarOpen(false)}
      />

      <ChatContainer
        messages={messages}
        isSending={isSending}
        onSend={handleSend}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />
    </div>
  );
}
