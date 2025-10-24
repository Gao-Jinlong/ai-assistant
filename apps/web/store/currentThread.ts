import { ThreadDto } from '@web/service/thread';
import { Store } from '.';
import { nanoid } from 'nanoid';
import type { SSEMessage } from '@server/chat/dto/sse-message.dto';
import { MESSAGE_ROLE, MESSAGE_TYPE } from '@server/chat/chat.interface';
export interface CurrentThreadStoreState {
  currentThread: ThreadDto | null;
  messageList: SSEMessage[];
  isResponding: boolean;
}
export interface CurrentThreadStoreActions {
  clearCurrent: () => void;
  setCurrentThread: (current: ThreadDto | null) => void;
  setIsResponding: (isResponding: boolean) => void;
  appendMessage: (message: SSEMessage) => void;
  sendMessage: (message: string) => void;
  setMessageList: (messageList: SSEMessage[]) => void;
}

export interface CurrentThreadStore
  extends CurrentThreadStoreState,
    CurrentThreadStoreActions {}

const createThreadSlice: Store<CurrentThreadStore> = (set, get, store) => ({
  isResponding: false,
  currentThread: null,
  messageList: [],
  clearCurrent: () => {
    set({
      currentThread: null,
      isResponding: false,
    });
  },
  appendMessage: (message) => {
    const { messageList } = get();
    const lastMessage = messageList[messageList.length - 1];

    if (
      message.metadata?.groupId &&
      lastMessage?.metadata?.groupId === message.metadata?.groupId
    ) {
      const newMessage = mergeMessage(lastMessage, message);
      set({
        messageList: [...messageList.slice(0, -1), newMessage],
      });
      return;
    } else {
      set({
        messageList: [...messageList, message],
      });
    }
  },
  sendMessage: (message) => {
    set({
      messageList: [
        ...get().messageList,
        {
          type: MESSAGE_TYPE.MESSAGE_CHUNK,
          data: {
            content: message,
            role: MESSAGE_ROLE.HUMAN,
          },
          metadata: {
            groupId: get().currentThread?.uid ?? '',
            timestamp: Date.now(),
          },
        },
      ],
    });
  },
  setCurrentThread: (current) => set({ currentThread: current }),
  setIsResponding: (isResponding) => set({ isResponding }),
  setMessageList: (messageList) => set({ messageList }),
});

export { createThreadSlice as createCurrentThreadSlice };

function mergeMessage(
  lastMessage: SSEMessage,
  message: SSEMessage,
): SSEMessage {
  const { type, data, metadata } = message;
  if (
    type === MESSAGE_TYPE.MESSAGE_CHUNK &&
    lastMessage.type === MESSAGE_TYPE.MESSAGE_CHUNK
  ) {
    return {
      ...lastMessage,
      metadata,
      data: {
        ...lastMessage.data,
        content: lastMessage.data.content + data.content,
      },
    };
  }
  return message;
}
