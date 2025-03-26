'use client';

import { useState } from 'react';
import { ConversationSidebar } from '@web/app/[locale]/chat/conversation-sidebar';
import { ChatContainer } from '@web/app/[locale]/chat/chat-container';
import { Allotment } from 'allotment';

export default function ChatPage() {
  const [isSending] = useState(false);

  return (
    <div className="flex flex-1 bg-gray-50">
      <Allotment>
        <Allotment.Pane preferredSize={256} minSize={200}>
          <ConversationSidebar />
        </Allotment.Pane>
        <Allotment.Pane>
          <ChatContainer isSending={isSending} />
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}
