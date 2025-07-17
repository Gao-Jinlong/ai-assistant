'use client';

import { useCallback, useMemo } from 'react';
import { Allotment } from 'allotment';
import { useTranslations } from 'next-intl';
import { Button } from '@web/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { MessageCircle, Plus, AlertCircle } from 'lucide-react';
import { useChat } from '@web/hooks/use-chat';
import { Alert, AlertDescription } from '@web/components/ui/alert';

export default function ChatPage() {
  const t = useTranslations();
  const {
    conversations,
    currentConversation,
    currentConversationId,
    isLoading,
    isLoadingConversations,
    error,
    createConversation,
    sendMessage,
    clearError,
  } = useChat();

  return (
    <div className="flex h-screen w-full flex-col">
      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive" className="mx-4 mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="outline" size="sm" onClick={clearError}>
              关闭
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 主内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        <Allotment>
          <Allotment.Pane minSize={280} maxSize={400} preferredSize={320}>
            <div className="h-full border-r bg-gray-50"></div>
          </Allotment.Pane>

          {/* 右侧对话内容 */}
          <Allotment.Pane>
            <div className="flex h-full flex-col bg-white"></div>
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
}
