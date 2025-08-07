import { MessageDto } from '@web/service/thread';
import { useCallback, useRef, useEffect } from 'react';
import { requestUtils, sseUtils } from '@web/utils';
import { toast } from 'sonner';
import { chatService } from '@web/service';

export interface UseSSEMessagesProps {
  onMessage: (message: MessageDto) => void;
  onLoadingChange: (loading: boolean) => void;
}

export const useSSEMessages = ({
  onMessage,
  onLoadingChange,
}: UseSSEMessagesProps) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  // TODO: 切换thread 时，需要断开连接

  const handleMessage = useCallback(
    (data: any) => {
      if (data.type === 'message_chunk') {
        onMessage(data.data);
      }
    },
    [onMessage],
  );

  const sendMessage = useCallback(
    async (threadUid: string, message: string) => {
      try {
        // 取消之前的连接
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        onLoadingChange(true);

        // 创建新的 AbortController
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const data = {
          threadUid,
          message,
        };
        const stream = chatService.startChat(data, {
          signal: controller.signal,
        });

        for await (const chunk of stream) {
          handleMessage(chunk);
        }
      } catch (error: unknown) {
        console.error('Failed to send message:', error);
        toast.error(requestUtils.getErrorMessage(error));
      } finally {
        onLoadingChange(false);
      }
    },
    [handleMessage, onLoadingChange],
  );

  // 清理函数
  const disconnect = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { sendMessage, disconnect };
};
