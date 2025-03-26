'use client';

import { Button } from '@web/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ConversationList from '@web/components/conversation-list';
import { cn } from '@web/lib/utils';
import { useConversation } from './context';
import { useAuth } from '@web/contexts/auth-context';
import { FC, useCallback } from 'react';
import { Conversation } from '@ant-design/x/es/conversations';

interface ConversationSidebarProps {}

const ConversationSidebar: FC<ConversationSidebarProps> = () => {
  const t = useTranslations('chat');

  const { payload } = useAuth()!;

  const {
    query,
    create,
    list,
    remove,
    currentKey,
    currentConversation,
    setCurrentKey,
  } = useConversation();

  const handleCreate = useCallback(async () => {
    if (!payload) return;

    if (!currentConversation?.data?.lastMessage) {
      setCurrentKey(undefined);
    }

    // const conversation = await create.mutateAsync({
    //   title: 'New Chat',
    // });

    // await query.refetch();
  }, [currentConversation?.data?.lastMessage, payload, setCurrentKey]);

  const handleDelete = useCallback(
    async (conversation: Conversation) => {
      await remove.mutateAsync(conversation.key);
      await query.mutateAsync();
    },
    [remove, query],
  );

  return (
    <div
      className={cn(
        'inset-y-0 left-0 z-50 flex h-full flex-1 transform flex-col justify-start border-r border-gray-200 bg-white transition-transform md:relative md:translate-x-0',
      )}
    >
      <div className="flex flex-1 items-center justify-between border-b p-2">
        <h2 className="font-semibold">{t('conversations')}</h2>
      </div>

      <div className="flex p-3">
        <Button
          className="flex w-full max-w-52 justify-center gap-2"
          onClick={handleCreate}
        >
          <PlusCircle size={18} />
          {t('newChat')}
        </Button>
      </div>

      <div className="h-full overflow-y-auto">
        <ConversationList
          items={list}
          activeKey={currentKey}
          onDelete={handleDelete}
          onActiveChange={setCurrentKey}
        />
      </div>
    </div>
  );
};

export { ConversationSidebar };
