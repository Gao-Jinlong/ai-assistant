import { Conversations } from '@ant-design/x';
import { useCallback } from 'react';
import { type GetProp, Space } from 'antd';
import { CommentOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  Conversation,
  ConversationsProps,
} from '@ant-design/x/es/conversations';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

export interface ConversationListProps extends ConversationsProps {
  onDelete?: (conversation: Conversation) => void;
}

export default function ConversationList({
  onDelete,
  ...props
}: ConversationListProps) {
  const t = useTranslations('conversationList');

  const menuConfig: ConversationsProps['menu'] = useCallback(
    (conversation: Conversation) => ({
      items: [
        {
          label: t('delete'),
          key: 'delete',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => {
            onDelete?.(conversation);
          },
        },
      ],
    }),
    [t, onDelete],
  );

  const groupable: GetProp<typeof Conversations, 'groupable'> = {
    sort(a, b) {
      if (a === b) return 0;
      return dayjs(b).diff(dayjs(a));
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

  return <Conversations groupable={groupable} menu={menuConfig} {...props} />;
}
