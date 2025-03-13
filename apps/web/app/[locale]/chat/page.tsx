'use client';

import { useState, useRef, useEffect } from 'react';
import ChatWindow, { MessageType } from '@web/components/chat-window';
import SenderInput from '@web/components/sender';
import { useTranslations } from 'next-intl';
import { trpc } from '@web/app/trpc';

export default function ChatPage() {
  const t = useTranslations('chat');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const senderRef = useRef<HTMLFormElement>(null);
  const chatMutation = trpc.chat.chat.useMutation({
    onSuccess: (data) => {
      // 处理响应数据
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          content: data,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    },
  });

  useEffect(() => {
    // 初始欢迎消息
    setMessages([
      {
        id: '1',
        content: t('welcomeMessage', {
          defaultValue: 'Hello! How can I assist you today?',
        }),
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
  }, [t]);

  const handleSend = async (text: string) => {
    // 添加用户消息
    const userMessage = {
      id: String(Date.now()),
      content: text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // 提交到API
    const messagesToSend = [
      ...messages.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: text },
    ] as { role: 'user' | 'assistant'; content: string }[];

    try {
      await chatMutation.mutateAsync(messagesToSend);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          content: t('errorMessage', {
            defaultValue: 'Sorry, there was an error processing your request.',
          }),
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <ChatWindow messages={messages} />
      <div className="border-t border-gray-200 px-4 py-2">
        <SenderInput
          onSend={handleSend}
          placeholder={t('typeMessage', { defaultValue: 'Type a message...' })}
          ref={senderRef}
        />
      </div>
    </div>
  );
}
