'use client';
import { UserOutlined } from '@ant-design/icons';
import { Bubble } from '@ant-design/x';
import type { BubbleProps } from '@ant-design/x';
import { cn } from '@web/lib/utils';
import { Typography } from 'antd';
import markdownit from 'markdown-it';
/* eslint-disable react/no-danger */
import React, { FC } from 'react';

const md = markdownit({ html: true, breaks: true });

const text = `
## test

> Render as markdown content to show rich text!

Link: [Ant Design X](https://x.ant.design)
`.trim();

const renderMarkdown: BubbleProps['messageRender'] = (content) => (
  <Typography>
    <div dangerouslySetInnerHTML={{ __html: md.render(content) }} />
  </Typography>
);

export interface MessageType {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatWindowProps {
  messages: MessageType[];
}

const ChatWindow: FC<ChatWindowProps> = ({ messages }) => {
  const [renderKey, setRenderKey] = React.useState(0);

  React.useEffect(() => {
    const id = setTimeout(
      () => {
        setRenderKey((prev) => prev + 1);
      },
      text.length * 100 + 2000,
    );

    return () => {
      clearTimeout(id);
    };
  }, [renderKey]);

  return (
    <div key={renderKey} className={cn('w-full')}>
      <Bubble
        typing
        content={text}
        messageRender={renderMarkdown}
        avatar={{ icon: <UserOutlined /> }}
      />
    </div>
  );
};

export default ChatWindow;
