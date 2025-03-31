'use client';
import { Bubble } from '@ant-design/x';
import type { BubbleProps } from '@ant-design/x';
import { BubbleDataType } from '@ant-design/x/es/bubble/BubbleList';
import { cn } from '@web/lib/utils';
import { GetProp, Typography } from 'antd';
import markdownit from 'markdown-it';
/* eslint-disable react/no-danger */
import React, { FC, useMemo } from 'react';

const md = markdownit({ html: true, breaks: true });

const renderMarkdown: BubbleProps['messageRender'] = (content) => (
  <Typography>
    <div dangerouslySetInnerHTML={{ __html: md.render(content) }} />
  </Typography>
);
const roles: GetProp<typeof Bubble.List, 'roles'> = {
  bot: {
    placement: 'start',
    typing: { step: 5, interval: 20 },
    styles: {
      content: {
        borderRadius: 16,
      },
    },
  },
  user: {
    placement: 'end',
    variant: 'shadow',
  },
};
export interface MessageType {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface MessageListProps {
  messages: BubbleDataType[];
}

const MessageList: FC<MessageListProps> = ({ messages }) => {
  const items = useMemo(() => {
    return messages.map((item) => {
      return {
        ...item,
        messageRender: renderMarkdown,
      };
    });
  }, [messages]);

  return (
    <div className={cn('flex h-full w-full flex-1 flex-col gap-2')}>
      <Bubble.List items={items} roles={roles} />
    </div>
  );
};

export default MessageList;
