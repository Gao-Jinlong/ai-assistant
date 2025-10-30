import { MESSAGE_ROLE } from '@common/constants';
import { MESSAGE_TYPE } from '@server/chat/chat.interface';
import type { StreamMessage } from '@server/chat/dto/sse-message.dto';
import { ThreadVO } from '@web/service/thread';
import useBoundStore, { Store } from '.';
import { uuid as uuidUtils } from '@common/utils';
import { chatService } from '@web/service';

export interface CurrentThreadStoreState {
  currentThread: ThreadVO | null;
  messageIds: Set<string>;
  messages: Map<string, StreamMessage>;
  responding: boolean;
}
export interface CurrentThreadStoreActions {
  clearCurrent: () => void;
  setCurrentThread: (current: ThreadVO | null) => void;
  setResponding: (responding: boolean) => void;
  appendMessage: (message: StreamMessage) => void;
  updateMessage: (message: StreamMessage) => void;
  updateMessages: (messages: StreamMessage[]) => void;
  setMessages: (messageList: StreamMessage[]) => void;
}

export interface CurrentThreadStore
  extends CurrentThreadStoreState,
    CurrentThreadStoreActions {}

const currentThreadSlice: Store<CurrentThreadStore> = (set, get, store) => ({
  responding: false,
  currentThread: null,
  messageIds: new Set(),
  messages: new Map(),
  clearCurrent: () => {
    set({
      currentThread: null,
      responding: false,
      messageIds: new Set(),
      messages: new Map(),
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
  updateMessage: (message) => {
    set((state) => {
      return {
        messages: new Map(state.messages).set(message.id, message),
      };
    });
  },
  updateMessages: (messages) => {
    set((state) => {
      messages.forEach((message) => {
        state.messages.set(message.id, message);
      });
      return {
        messages: new Map(state.messages),
      };
    });
  },
  setCurrentThread: (current) => set({ currentThread: current }),
  setResponding: (isResponding) => set({ responding: isResponding }),
  setMessages: (messageList) => {
    set({
      messages: new Map(messageList.map((message) => [message.id, message])),
      messageIds: new Set(messageList.map((message) => message.id)),
    });
  },
});

export { currentThreadSlice as createCurrentThreadSlice };

export async function sendMessage(
  content: string,
  options?: { signal?: AbortSignal },
) {
  const threadId =
    useBoundStore.getState().currentThread?.uid ?? uuidUtils.generateThreadId();
  if (content == null) {
    return;
  }
  try {
    setResponding(true);

    const message: StreamMessage = {
      id: uuidUtils.generateMessageId(),
      type: MESSAGE_TYPE.MESSAGE_CHUNK,
      data: {
        content,
        role: MESSAGE_ROLE.HUMAN,
      },
      metadata: {
        timestamp: Date.now(),
      },
    };
    appendMessage(message);

    const stream = chatService.chatStream(
      content,
      {
        threadId,
      },
      options,
    );

    let updateTimer: ReturnType<typeof setTimeout> | null = null;
    const pendingMessages: Map<string, StreamMessage> = new Map();
    const scheduleUpdate = () => {
      if (updateTimer) clearTimeout(updateTimer);
      updateTimer = setTimeout(() => {
        // Batch update message status
        if (pendingMessages.size > 0) {
          updateMessages(pendingMessages.values().toArray());
          pendingMessages.clear();
        }
        updateTimer = null;
      }, 16); // ~60fps
    };

    for await (const chunk of stream) {
      if (chunk.type === MESSAGE_TYPE.MESSAGE_CHUNK) {
        const message = handleMessageChunk(chunk);
        if (message) {
          pendingMessages.set(message.id, message);
          scheduleUpdate();
        }
      }
    }

    return message;
  } finally {
    setResponding(false);
  }
}
export function setMessages(messages: StreamMessage[]) {
  useBoundStore.getState().setMessages(messages);
}

function handleMessageChunk(
  chunk: StreamMessage & { type: MESSAGE_TYPE.MESSAGE_CHUNK },
) {
  let message: StreamMessage | undefined;
  if (!existsMessage(chunk.id)) {
    message = appendMessage(chunk);
  }
  message ??= getMessage(chunk.id);
  if (message) {
    message = mergeMessage(message, chunk);
  }
  return message;
}

function setResponding(responding: boolean) {
  useBoundStore.getState().setResponding(responding);
  return responding;
}
function appendMessage(message: StreamMessage) {
  useBoundStore.getState().appendMessage(message);
  return message;
}
function existsMessage(messageId: string) {
  return useBoundStore.getState().messageIds.has(messageId);
}
function getMessage(messageId: string) {
  return useBoundStore.getState().messages.get(messageId);
}
function updateMessage(message: StreamMessage) {
  useBoundStore.getState().updateMessage(message);
  return message;
}
function updateMessages(messages: StreamMessage[]) {
  useBoundStore.getState().updateMessages(messages);
  return messages;
}
function mergeMessage(
  message: StreamMessage,
  chunk: StreamMessage,
): StreamMessage {
  if (
    message.type === MESSAGE_TYPE.MESSAGE_CHUNK &&
    chunk.type === MESSAGE_TYPE.MESSAGE_CHUNK
  ) {
    return {
      ...message,
      data: {
        ...message.data,
        content: (message.data.content ?? '') + (chunk.data.content ?? ''),
      },
    };
  }
  return message;
}
