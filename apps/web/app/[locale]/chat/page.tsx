'use client';

import { useState, useRef, useEffect } from 'react';
import ChatWindow, { MessageType } from '@web/components/chat-window';
import SenderInput from '@web/components/sender';
import { useTranslations, useLocale } from 'next-intl';
import { trpc } from '../../trpc';
import ConversationList from '@web/components/conversation-list';
import { getUserPayload, useAuth } from '@web/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { PlusCircle, Menu, X } from 'lucide-react';
import { Skeleton } from '@web/components/ui/skeleton';
import { Button } from '@web/components/ui/button';
import { GetRef } from 'antd';
import { Sender } from '@ant-design/x';
import { cn } from '@web/lib/utils';

export default function ChatPage() {
  const { payload, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('chat');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const senderRef = useRef<GetRef<typeof Sender>>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 检查用户是否已登录
  useEffect(() => {
    if (!authLoading && !payload && !getUserPayload()) {
      router.push(`/${locale}/login`);
    }
  }, [authLoading, payload, router, locale]);

  const chatMutation = trpc.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          content: data,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
      setIsSending(false);
    },
    onError: () => {
      setIsSending(false);
    },
  });

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleNewChat = () => {
    setMessages([
      {
        id: String(Date.now()),
        content: t('welcomeMessage', {
          defaultValue: 'Hello! How can I assist you today?',
        }),
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isSending) return;

    setIsSending(true);

    // 添加用户消息
    const userMessage: MessageType = {
      id: String(Date.now()),
      content: text,
      sender: 'user' as const,
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
      setIsSending(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-1 bg-gray-50">
      {/* 侧边栏 */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r border-gray-200 bg-white transition-transform md:relative md:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-semibold">{t('conversations')}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="p-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleNewChat}
          >
            <PlusCircle size={18} />
            {t('newChat')}
          </Button>
        </div>

        <div className="h-full flex-1 overflow-y-auto">
          <ConversationList items={[]} />
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex h-full flex-1 flex-col items-center justify-center overflow-hidden">
        {/* 顶部栏 */}
        <div className="flex w-full items-center border-b bg-white p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="mr-2 md:hidden"
          >
            <Menu size={20} />
          </Button>
          <h1 className="text-xl font-semibold">{t('chatTitle')}</h1>
        </div>

        {/* 聊天窗口 */}
        <div className="w-full flex-1 overflow-hidden p-4">
          <ChatWindow messages={messages} />
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <SenderInput
          className="mb-12 w-1/2 rounded-lg border border-gray-200 bg-white p-4"
          onSend={handleSend}
          placeholder={t('typeMessage', {
            defaultValue: 'Type a message...',
          })}
          ref={senderRef}
          disabled={isSending}
          isLoading={isSending}
        />
      </div>
    </div>
  );
}
