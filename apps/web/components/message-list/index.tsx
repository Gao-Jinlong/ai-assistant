'use client';
import { Bubble } from '@ant-design/x';
import type { BubbleProps } from '@ant-design/x';
import { cn } from '@web/lib/utils';
import { GetProp, Typography } from 'antd';
import markdownit from 'markdown-it';
import React, { FC, useMemo } from 'react';

const md = markdownit({ html: true, breaks: true });

const renderMarkdown: BubbleProps['messageRender'] = (content) => (
  <Typography>
    <div dangerouslySetInnerHTML={{ __html: md.render(content) }} />
  </Typography>
);

const roles: GetProp<typeof Bubble.List, 'roles'> = {
  assistant: {
    placement: 'start',
    typing: { step: 5, interval: 20 },
    styles: {
      content: {
        borderRadius: 16,
        backgroundColor: '#f8f9fa',
      },
    },
  },
  user: {
    placement: 'end',
    variant: 'shadow',
    styles: {
      content: {
        borderRadius: 16,
        backgroundColor: '#1677ff',
        color: 'white',
      },
    },
  },
};

export interface MessageType {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

export interface MessageListProps {
  messages: MessageType[];
}

const MessageList: FC<MessageListProps> = ({ messages }) => {
  const items = useMemo(() => {
    return messages.map((message) => ({
      key: message.id,
      content: message.content,
      role: message.role,
      messageRender: renderMarkdown,
    }));
  }, [messages]);

  return (
    <div className={cn('flex h-full w-full flex-1 flex-col gap-2')}>
      <Bubble.List items={items} roles={roles} />
    </div>
  );
};

export default MessageList;
