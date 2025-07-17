import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  chatService,
  type Conversation,
  type Message,
} from '../lib/chat-service';

interface UseChatOptions {
  autoLoadConversations?: boolean;
}

export function useChat(options: UseChatOptions = {}) {
  const { autoLoadConversations = true } = options;
  const t = useTranslations();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] =
    useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 当前对话
  const currentConversation = useMemo(
    () => conversations.find((conv) => conv.id === currentConversationId),
    [conversations, currentConversationId],
  );

  // 加载对话列表
  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setError(null);

    try {
      const data = await chatService.getConversations();
      setConversations(data);

      // 如果还没有选中的对话，选择第一个
      if (!currentConversationId && data.length > 0) {
        setCurrentConversationId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载对话失败');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentConversationId]);

  // 创建新对话
  const createConversation = useCallback(
    async (title?: string) => {
      setError(null);

      try {
        const newConversation = await chatService.createConversation(title);

        // 添加欢迎消息
        const welcomeMessage: Message = {
          id: `${newConversation.id}-welcome`,
          content: t('chat.welcomeMessage'),
          role: 'assistant',
          timestamp: Date.now(),
        };

        const conversationWithWelcome: Conversation = {
          ...newConversation,
          messages: [welcomeMessage],
        };

        setConversations((prev) => [conversationWithWelcome, ...prev]);
        setCurrentConversationId(newConversation.id);

        return conversationWithWelcome;
      } catch (err) {
        setError(err instanceof Error ? err.message : '创建对话失败');
        return null;
      }
    },
    [t],
  );

  // 发送消息
  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentConversation || isLoading || !content.trim()) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 创建用户消息
        const userMessage: Message = {
          id: `${Date.now()}-user`,
          content: content.trim(),
          role: 'user',
          timestamp: Date.now(),
        };

        // 立即添加用户消息到界面
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, userMessage],
                  updatedAt: new Date().toISOString(),
                }
              : conv,
          ),
        );

        // 发送消息到后端并获取 AI 回复
        await chatService.sendMessage(currentConversationId, content);
        const aiResponse = await chatService.getAIResponse(
          currentConversationId,
          content,
        );

        // 添加 AI 回复
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, aiResponse],
                  updatedAt: new Date().toISOString(),
                }
              : conv,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : '发送消息失败');

        // 发送失败时添加错误消息
        const errorMessage: Message = {
          id: `${Date.now()}-error`,
          content: t('chat.errorMessage'),
          role: 'assistant',
          timestamp: Date.now(),
        };

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, errorMessage],
                  updatedAt: new Date().toISOString(),
                }
              : conv,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [currentConversation, currentConversationId, isLoading, t],
  );

  // 删除对话
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      setError(null);

      try {
        await chatService.deleteConversation(conversationId);

        setConversations((prev) => {
          const newConversations = prev.filter(
            (conv) => conv.id !== conversationId,
          );

          // 如果删除的是当前对话，切换到第一个对话
          if (conversationId === currentConversationId) {
            const nextConversation = newConversations[0];
            setCurrentConversationId(nextConversation?.id || '');
          }

          return newConversations;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '删除对话失败');
      }
    },
    [currentConversationId],
  );

  // 选择对话
  const selectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
  }, []);

  // 更新对话标题
  const updateConversationTitle = useCallback(
    async (conversationId: string, title: string) => {
      setError(null);

      try {
        await chatService.updateConversationTitle(conversationId, title);

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? { ...conv, title, updatedAt: new Date().toISOString() }
              : conv,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : '更新标题失败');
      }
    },
    [],
  );

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 自动加载对话
  useEffect(() => {
    if (autoLoadConversations) {
      loadConversations();
    }
  }, [autoLoadConversations, loadConversations]);

  return {
    // 状态
    conversations,
    currentConversation,
    currentConversationId,
    isLoading,
    isLoadingConversations,
    error,

    // 操作
    loadConversations,
    createConversation,
    sendMessage,
    deleteConversation,
    selectConversation,
    updateConversationTitle,
    clearError,
  };
}
