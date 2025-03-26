'use client';

import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';
import MessageList from '@web/components/message-list';
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
}

export const ChatContainer: FC<ChatContainerProps> = ({ isSending }) => {
  const t = useTranslations('chat');
  const senderRef = useRef<GetRef<typeof Sender>>(null);
  const { currentConversation, create, getMessages, setCurrentKey } =
    useConversation();

  // TODO 对话 UI
  // 1. 对话列表
  // 2. 流式 api
  // 3. 历史对话记录
  const [messages, setMessages] = useState<BubbleDataType[]>([]);

  const isNewChat = useMemo(() => {
    return !currentConversation;
  }, [currentConversation]);

  useEffect(() => {
    if (currentConversation?.key) {
      getMessages.mutateAsync(currentConversation.key).then((data) => {
        setMessages(data.messages || []);
      });
    } else {
      setMessages([]);
    }
  }, [currentConversation?.key]);

  // ===================== event handlers =====================
  const onSend = useCallback(
    async (text: string) => {
      const conversation = await create.mutateAsync({
        title: 'New Chat',
        messages: [{ role: 'user', content: text }],
      });

      setCurrentKey(conversation.uid);
    },
    [create, setCurrentKey],
  );

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

      <div className="flex w-full flex-1 items-center justify-center overflow-hidden p-12">
        {isNewChat ? placeholderNode : <MessageList messages={messages} />}
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
};

export default ChatContainer;
