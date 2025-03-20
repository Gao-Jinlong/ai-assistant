'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import MessageList, { MessageType } from '@web/components/message-list';
import SenderInput from '@web/components/sender';
import { GetProp, GetRef, Space } from 'antd';
import { Prompts, Sender, Welcome } from '@ant-design/x';
import { useConversation } from './context';
import {
  CommentOutlined,
  EllipsisOutlined,
  FireOutlined,
  HeartOutlined,
  ReadOutlined,
  ShareAltOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { Button } from '@web/components/ui/button';
import BrandLogo from '@web/components/BrandLogo';
import { BubbleDataType } from '@ant-design/x/es/bubble/BubbleList';

const renderTitle = (icon: React.ReactElement, title: string) => (
  <Space align="start">
    {icon}
    <span>{title}</span>
  </Space>
);

const placeholderPromptsItems: GetProp<typeof Prompts, 'items'> = [
  {
    key: '1',
    label: renderTitle(
      <FireOutlined style={{ color: '#FF4D4F' }} />,
      'Hot Topics',
    ),
    description: 'What are you interested in?',
    children: [
      {
        key: '1-1',
        description: `What's new in X?`,
      },
      {
        key: '1-2',
        description: `What's AGI?`,
      },
      {
        key: '1-3',
        description: `Where is the doc?`,
      },
    ],
  },
  {
    key: '2',
    label: renderTitle(
      <ReadOutlined style={{ color: '#1890FF' }} />,
      'Design Guide',
    ),
    description: 'How to design a good product?',
    children: [
      {
        key: '2-1',
        icon: <HeartOutlined />,
        description: `Know the well`,
      },
      {
        key: '2-2',
        icon: <SmileOutlined />,
        description: `Set the AI role`,
      },
      {
        key: '2-3',
        icon: <CommentOutlined />,
        description: `Express the feeling`,
      },
    ],
  },
];

interface ChatContainerProps {
  isSending: boolean;
  onOpenSidebar: () => void;
}

export function ChatContainer({
  isSending,
  onOpenSidebar,
}: ChatContainerProps) {
  const t = useTranslations('chat');
  const senderRef = useRef<GetRef<typeof Sender>>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentConversation } = useConversation();

  const [messages, setMessages] = useState<BubbleDataType[]>([]);

  const isNewChat = useMemo(() => {
    return !messages.length;
  }, [messages]);

  // ===================== event handlers =====================
  const onSend = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        key: String(prev.length + 1),
        role: 'user',
        content: text,
        timestamp: new Date(),
      },
      {
        key: String(prev.length + 2),
        role: 'bot',
        content: '你好，我是AI助手，有什么可以帮助你的吗？',
        timestamp: new Date(),
      },
    ]);
  }, []);

  // ===================== node fragments =====================
  const placeholderNode = (
    <Space direction="vertical" size={16}>
      <Welcome
        variant="borderless"
        icon={<BrandLogo />}
        title={t('welcomeMessage')}
        description={t('welcomeDescription')}
        extra={
          <Space>
            <Button variant="outline" size="icon">
              <ShareAltOutlined />
            </Button>
            <Button variant="outline" size="icon">
              <EllipsisOutlined />
            </Button>
          </Space>
        }
      />
      <Prompts
        title="Do you want?"
        items={placeholderPromptsItems}
        styles={{
          list: {
            width: '100%',
          },
          item: {
            flex: 1,
          },
        }}
        onItemClick={() => {}}
      />
    </Space>
  );

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center overflow-hidden">
      {/* 顶部栏 */}
      <div className="flex w-full items-center justify-center border-b bg-white p-2">
        <h2 className="font-semibold">
          {currentConversation?.data?.title ?? t('chatTitle')}
        </h2>
      </div>

      <div className="flex w-full flex-1 items-center justify-center overflow-hidden p-4">
        {isNewChat ? (
          placeholderNode
        ) : (
          <>
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
          </>
        )}
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
