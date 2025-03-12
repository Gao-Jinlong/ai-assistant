'use client';
import { useState } from 'react';
import { Bubble, Sender, XProvider, useXChat } from '@ant-design/x';
import { Card } from '@web/components/ui/card';
import ConversationList from '@web/components/conversation-list';
import { Conversation } from '@ant-design/x/es/conversations';
import { MessageInfo } from '@ant-design/x/es/use-x-chat';
import ChatWindow from '@web/components/chat-window';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const mockData: Conversation[] = [
    {
      key: '1',
      label: '今天运势如何？',
      timestamp: 1715424000000,
      group: 'group1',
    },
    {
      key: '2',
      label: '明天天气怎么样？',
      timestamp: 1715424000000,
      group: 'group1',
    },
    {
      key: '3',
      label: '帮我写一个请假条',
      timestamp: 1715424000000,
      group: 'group2',
    },
  ];

  return (
    <XProvider>
      <div className="flex flex-1">
        <ConversationList items={mockData} />
        <ChatWindow />
      </div>
    </XProvider>
  );
}
