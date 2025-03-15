import { Conversations } from '@ant-design/x';
import { useCallback } from 'react';
import { type GetProp, Space, theme } from 'antd';
import { CommentOutlined } from '@ant-design/icons';
import { Conversation } from '@ant-design/x/es/conversations';

export interface ConversationListProps {
  items: Conversation[];
}
export default function ConversationList({ items }: ConversationListProps) {
  const { token } = theme.useToken();

  const groupable: GetProp<typeof Conversations, 'groupable'> = {
    sort(a, b) {
      if (a === b) return 0;

      return a === 'Today' ? -1 : 1;
    },
    title: (group, { components: { GroupTitle } }) =>
      group ? (
        <GroupTitle>
          <Space>
            <CommentOutlined />
            <span>{group}</span>
          </Space>
        </GroupTitle>
      ) : (
        <GroupTitle />
      ),
  };

  return (
    <Conversations
      groupable={groupable}
      defaultActiveKey="demo1"
      items={items}
    />
  );
}
