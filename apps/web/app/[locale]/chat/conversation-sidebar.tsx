'use client';

import { Button } from '@web/components/ui/button';
import { PlusCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ConversationList from '@web/components/conversation-list';
import { cn } from '@web/lib/utils';
import { useConversation } from './context';
import { useAuth } from '@web/contexts/auth-context';
import { useCallback } from 'react';

interface ConversationSidebarProps {
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export function ConversationSidebar({
  isSidebarOpen,
  onCloseSidebar,
}: ConversationSidebarProps) {
  const t = useTranslations('chat');

  const { payload } = useAuth()!;
  const { query, create, list } = useConversation();

  const handleCreate = useCallback(async () => {
    if (!payload) return;

    await create.mutateAsync({
      title: 'New Chat',
    });

    query.refetch();
  }, [create, payload?.user.uid]);

  return (
    <div
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r border-gray-200 bg-white transition-transform md:relative md:translate-x-0',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="flex items-center justify-between border-b p-2">
        <h2 className="font-semibold">{t('conversations')}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCloseSidebar}
          className="md:hidden"
        >
          <X size={20} />
        </Button>
      </div>

      <div className="p-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleCreate}
        >
          <PlusCircle size={18} />
          {t('newChat')}
        </Button>
      </div>

      <div className="h-full flex-1 overflow-y-auto">
        <ConversationList items={list} />
      </div>
    </div>
  );
}
