import { MessageDto } from '@web/service/thread';
import { useCallback, useState, useRef, useEffect } from 'react';
import { LOGIN_INFO_KEY } from '@web/constant';
import { sse } from '@web/service/fetch';

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

  const sendMessage = useCallback(
    async (threadUid: string, message: string) => {
      // 取消之前的连接
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      onLoadingChange(true);

      // 获取 token
      const getToken = () => {
        try {
          const localLoginInfo = localStorage.getItem(LOGIN_INFO_KEY);
          if (localLoginInfo) {
            const parsed = JSON.parse(localLoginInfo);
            return parsed.state?.loginInfo?.token?.access_token;
          }
        } catch (error: unknown) {
          console.error('Failed to get token:', error);
        }
        return null;
      };

      const token = getToken();
      if (!token) {
        console.error('No token found');
        onLoadingChange(false);
        return;
      }

      // 创建新的 AbortController
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        const body = {
          threadUid,
          message,
        };
        console.log('🚀 ~ useSSEMessages ~ body:', body);
        const response = await sse(`chat`, {
          signal: controller.signal,
          method: 'POST',
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        try {
          while (true) {
            const { value, done } = await reader.read();

            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });

            console.log('🚀 ~ forawait ~ buffer:', buffer);

            // 处理 SSE 消息格式： id: 1 \n data: {...}\n\n
            // let boundaryIndex;
            // while ((boundaryIndex = buffer.indexOf('\n\n')) !== -1) {
            //   const chunkStr = buffer.slice(0, boundaryIndex).trim();
            //   buffer = buffer.slice(boundaryIndex + 2);

            //   const chunkArr = chunkStr.split('\n');
            //   const chunk = chunkArr[1];
            //   if (chunk.startsWith('data:')) {
            //     const dataStr = chunk.replace(/^data:\s*/, '').trim();
            //     if (dataStr) {
            //       try {
            //         const messageData = JSON.parse(dataStr);
            //         onMessage(messageData);
            //       } catch (parseError) {
            //         console.error(
            //           'Failed to parse SSE message:',
            //           parseError,
            //           dataStr,
            //         );
            //       }
            //     }
            //   }
            // }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('SSE connection aborted', error);
        } else {
          console.error('SSE connection error:', error);
        }
      } finally {
        onLoadingChange(false);
        abortControllerRef.current = null;
      }
    },
    [onLoadingChange, onMessage],
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
