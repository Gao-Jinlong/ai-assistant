import { MESSAGE_ROLE, MESSAGE_TYPE } from '@server/chat/chat.interface';
import type { StreamMessage } from '@server/chat/dto/sse-message.dto';
import { ThreadDto } from '@web/service/thread';
import { Store } from '.';
export interface CurrentThreadStoreState {
  currentThread: ThreadDto | null;
  messageIds: Set<string>;
  messages: Map<string, StreamMessage>;
  isResponding: boolean;
}
export interface CurrentThreadStoreActions {
  clearCurrent: () => void;
  setCurrentThread: (current: ThreadDto | null) => void;
  setIsResponding: (isResponding: boolean) => void;
  appendMessage: (message: StreamMessage) => void;
  updateMessage: (message: StreamMessage) => void;
  setMessageList: (messageList: Map<string, StreamMessage>) => void;
}

export interface CurrentThreadStore
  extends CurrentThreadStoreState,
    CurrentThreadStoreActions {}

const createThreadSlice: Store<CurrentThreadStore> = (set, get, store) => ({
  isResponding: false,
  currentThread: null,
  messageIds: new Set(),
  messages: new Map(),
  clearCurrent: () => {
    set({
      currentThread: null,
      isResponding: false,
    });
  },
  appendMessage: (message) => {
    set((state) => {
      const newMessageIds = state.messageIds.has(message.id)
        ? state.messageIds
        : new Set(state.messageIds).add(message.id);
      return {
        messageIds: newMessageIds,
        messages: new Map(state.messages).set(message.id, message),
      };
    });
  },
  updateMessage: (message: StreamMessage) => {
    set((state) => {
      return {
        messages: new Map(state.messages).set(message.id, message),
      };
    });
  },
  // sendMessage: (message) => {
  //   set({
  //     messages: [
  //       ...get().messages,
  //       {
  //         type: MESSAGE_TYPE.MESSAGE_CHUNK,
  //         data: {
  //           content: message,
  //           role: MESSAGE_ROLE.HUMAN,
  //         },
  //         metadata: {
  //           groupId: get().currentThread?.uid ?? '',
  //           timestamp: Date.now(),
  //         },
  //       },
  //     ],
  //   });
  // },
  setCurrentThread: (current) => set({ currentThread: current }),
  setIsResponding: (isResponding) => set({ isResponding }),
  setMessageList: (messageList) => set({ messages: messageList }),
});

export { createThreadSlice as createCurrentThreadSlice };

// TODO 重构前端对话逻辑
export function sendMessage(message: string) {}
function mergeMessage(
  lastMessage: StreamMessage,
  message: StreamMessage,
): StreamMessage {
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
