'use client';

import { useState, useEffect, use } from 'react';
import { MessageType } from '@web/components/message-list';
import { useTranslations, useLocale } from 'next-intl';
import { Skeleton } from '@web/components/ui/skeleton';
import { ConversationSidebar } from '@web/app/[locale]/chat/conversation-sidebar';
import { ChatContainer } from '@web/app/[locale]/chat/chat-container';
import { Allotment } from 'allotment';
import { useConversation } from './context';

export default function ChatPage() {
  const t = useTranslations('chat');
  const [isSending, setIsSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { query } = useConversation();

  return (
    <div className="flex flex-1 bg-gray-50">
      <Allotment>
        <Allotment.Pane preferredSize={256} minSize={200}>
          <ConversationSidebar
            isSidebarOpen={isSidebarOpen}
            onCloseSidebar={() => setIsSidebarOpen(false)}
          />
        </Allotment.Pane>
        <Allotment.Pane>
          <ChatContainer
            isSending={isSending}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}
