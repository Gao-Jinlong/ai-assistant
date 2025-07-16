'use client';

import { useCallback, useMemo } from 'react';
import { Allotment } from 'allotment';
import { useTranslations } from 'next-intl';
import {
  Conversation,
  ConversationsProps,
} from '@ant-design/x/es/conversations';
import ConversationList from '@web/components/conversation-list';
import MessageList from '@web/components/message-list';
import SenderInput from '@web/components/sender';
import { Button } from '@web/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { MessageCircle, Plus, AlertCircle } from 'lucide-react';
import { useChat } from '@web/lib/hooks/use-chat';
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
    deleteConversation,
    selectConversation,
    clearError,
  } = useChat();

  // 处理对话选择
  const handleConversationSelect: ConversationsProps['onActiveChange'] =
    useCallback(
      (key: string) => {
        selectConversation(key);
      },
      [selectConversation],
    );

  // 处理删除对话
  const handleDeleteConversation = useCallback(
    (conversation: Conversation) => {
      deleteConversation(conversation.key as string);
    },
    [deleteConversation],
  );

  // 转换为 ConversationList 需要的格式
  const conversationItems = useMemo(
    () =>
      conversations.map((conv) => ({
        key: conv.id,
        label: conv.title,
        group: new Date(conv.updatedAt).toLocaleDateString(),
      })),
    [conversations],
  );

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

      {/* 页面标题 */}
      <div className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900">
              {t('chat.chatTitle')}
            </h1>
          </div>
          <Button
            onClick={() => createConversation()}
            className="flex items-center space-x-2"
            disabled={isLoadingConversations}
          >
            <Plus className="h-4 w-4" />
            <span>{t('chat.newChat')}</span>
          </Button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        <Allotment>
          {/* 左侧对话列表 */}
          <Allotment.Pane minSize={280} maxSize={400} preferredSize={320}>
            <div className="h-full border-r bg-gray-50">
              <div className="border-b bg-white px-4 py-3">
                <h2 className="font-medium text-gray-900">
                  {t('chat.conversations')}
                </h2>
              </div>
              <div className="h-full overflow-auto">
                {isLoadingConversations ? (
                  <div className="flex h-full items-center justify-center p-4">
                    <div className="text-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                      <p className="mt-2 text-sm text-gray-500">加载中...</p>
                    </div>
                  </div>
                ) : conversations.length > 0 ? (
                  <ConversationList
                    items={conversationItems}
                    activeKey={currentConversationId}
                    onActiveChange={handleConversationSelect}
                    onDelete={handleDeleteConversation}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4">
                    <Card className="w-full">
                      <CardContent className="pt-6 text-center">
                        <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          暂无对话记录
                        </p>
                        <Button
                          onClick={() => createConversation()}
                          className="mt-4"
                          size="sm"
                        >
                          创建新对话
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </Allotment.Pane>

          {/* 右侧对话内容 */}
          <Allotment.Pane>
            <div className="flex h-full flex-col bg-white">
              {currentConversation ? (
                <>
                  {/* 对话标题 */}
                  <div className="border-b px-6 py-4">
                    <h3 className="font-medium text-gray-900">
                      {currentConversation.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {currentConversation.messages.length} 条消息
                    </p>
                  </div>

                  {/* 消息列表 */}
                  <div className="flex-1 overflow-auto p-4">
                    <MessageList messages={currentConversation.messages} />
                  </div>

                  {/* 消息输入 */}
                  <div className="border-t p-4">
                    <SenderInput
                      placeholder={t('chat.typeMessage')}
                      onSend={sendMessage}
                      disabled={isLoading}
                      isLoading={isLoading}
                      className="w-full"
                    />
                    {isLoading && (
                      <p className="mt-2 text-sm text-blue-600">
                        {t('chat.sending')}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                /* 欢迎界面 */
                <div className="flex h-full items-center justify-center">
                  <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                      <MessageCircle className="mx-auto h-16 w-16 text-blue-600" />
                      <CardTitle className="text-xl">
                        {t('chat.welcomeMessage')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="mb-4 text-sm text-gray-500">
                        {t('chat.welcomeDescription')}
                      </p>
                      <Button onClick={() => createConversation()}>
                        {t('chat.newChat')}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
}
