import { MESSAGE_ROLE } from '@common/constants';
import { MESSAGE_TYPE } from '@server/chat/chat.interface';
import type { StreamMessage } from '@server/chat/dto/sse-message.dto';
import {
  getThreadDetail,
  getThreadMessages,
  ThreadVO,
} from '@web/service/thread';
import useBoundStore, { Store } from '.';
import { uuid as uuidUtils } from '@common/utils';
import { chatService } from '@web/service';
import { ThreadStatus } from '@server/thread/thread-status.enum';
import { updateThread } from './threads';

export interface ActiveThreadStoreState {
  activeThread: ThreadVO | null;
  messageIds: Set<string>;
  messages: Map<string, StreamMessage>;
  responding: boolean;
  loading: boolean;
}
export interface ActiveThreadStoreActions {
  setLoading: (loading: boolean) => void;
  clearActiveThread: () => void;
  setActiveThread: (current: ThreadVO | null) => void;
  setResponding: (responding: boolean) => void;
  appendMessage: (message: StreamMessage) => void;
  updateMessage: (message: StreamMessage) => void;
  updateMessages: (messages: StreamMessage[]) => void;
  setMessages: (messageList: StreamMessage[]) => void;
}

export interface ActiveThreadStore
  extends ActiveThreadStoreState,
    ActiveThreadStoreActions {}

// TODO 重构 activeThread 状态管理
// 将 activeThread 的 abortController 转移到 store 中
// 通过 js module 作用域管理 activeThread 的状态
let abortController: AbortController | null = null;

const activeThreadSlice: Store<ActiveThreadStore> = (set, get, store) => ({
  responding: false,
  loading: false,
  activeThread: null,
  messageIds: new Set(),
  messages: new Map(),
  setLoading: (loading) => set({ loading }),
  clearActiveThread: () => {
    set({
      activeThread: null,
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
  setActiveThread: (current) => set({ activeThread: current }),
  setResponding: (isResponding) => set({ responding: isResponding }),
  setMessages: (messageList) => {
    set({
      messages: new Map(messageList.map((message) => [message.id, message])),
      messageIds: new Set(messageList.map((message) => message.id)),
    });
  },
});

export { activeThreadSlice as createActiveThreadSlice };

export async function setActiveThread(thread: ThreadVO) {
  const store = useBoundStore.getState();
  const currentThread = store.activeThread;
  if (currentThread?.uid === thread.uid) {
    return;
  }
  store.setLoading(true);

  // 中断之前的请求（无论是 /chat 还是 /restore）
  abortController?.abort();
  // 重置 abortController，避免重复 abort
  abortController = null;

  store.clearActiveThread();
  store.setActiveThread(thread);

  try {
    if (thread.uid) {
      const detail = await getThreadDetail(thread.uid);
      if (detail.data?.status === ThreadStatus.IN_PROGRESS) {
        updateThread(detail.data);
        // 恢复未结束的对话消息接收
        await restoreChat(thread);
      } else {
        await restoreThread(thread);
      }
    }
  } finally {
    store.setLoading(false);
  }
}
async function restoreThread(thread: ThreadVO) {
  const response = await getThreadMessages(thread.uid);
  setMessages(response.data);
}
/**
 * 发送消息处理函数
 * 没有 activeThread 时会自动创建新的 thread
 * 有 activeThread 时会继续当前对话
 */
export async function sendMessage(
  content: string,
  options?: { signal?: AbortController },
) {
  abortController = options?.signal || new AbortController();
  const signal = abortController.signal;
  const threadId =
    useBoundStore.getState().activeThread?.uid ?? uuidUtils.generateThreadId();
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
    const pendingMessages: Map<string, StreamMessage[]> = new Map();
    const scheduleUpdate = () => {
      if (updateTimer) clearTimeout(updateTimer);
      updateTimer = setTimeout(() => {
        updateMessages(pendingMessages);
        pendingMessages.clear();
      }, 16); // ~60fps
    };

    for await (const chunk of stream) {
      if (signal?.aborted) {
        break;
      }
      if (chunk.type === MESSAGE_TYPE.MESSAGE_CHUNK) {
        if (pendingMessages.has(chunk.id)) {
          pendingMessages.get(chunk.id)?.push(chunk);
        } else {
          pendingMessages.set(chunk.id, [chunk]);
        }

        scheduleUpdate();
      }
    }

    return message;
  } finally {
    setResponding(false);
  }
}

/**
 * 恢复正在进行中的对话的消息接收
 * @param thread - 要恢复的线程对象
 */
async function restoreChat(thread: ThreadVO) {
  const store = useBoundStore.getState();

  // 创建 AbortController 并立即存储到模块级变量
  // 这样 setActiveThread 可以在中断时访问到它
  abortController = new AbortController();
  const signal = abortController.signal;

  try {
    // 1. 先从数据库加载已持久化的历史消息
    // 这样可以确保用户看到完整的对话历史
    try {
      const response = await getThreadMessages(thread.uid);
      if (response.data && response.data.length > 0) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Failed to load thread messages from database:', error);
      // 即使加载失败，也继续接收 Kafka 消息
    }

    // 2. 开始恢复聊天时，取消 loading 状态并设置 responding 状态
    store.setLoading(false);
    setResponding(true);

    // 3. 从 Kafka 接收实时消息流（包含所有消息，包括历史和新增的）
    const stream = chatService.restoreChatStream(thread.uid, {
      signal: abortController,
    });

    let updateTimer: ReturnType<typeof setTimeout> | null = null;
    const pendingMessages: Map<string, StreamMessage[]> = new Map();
    const scheduleUpdate = () => {
      if (updateTimer) clearTimeout(updateTimer);
      updateTimer = setTimeout(() => {
        updateMessages(pendingMessages);
        pendingMessages.clear();
      }, 16); // ~60fps
    };

    for await (const chunk of stream) {
      if (signal.aborted) {
        break;
      }

      // 处理不同类型的消息
      switch (chunk.type) {
        case MESSAGE_TYPE.MESSAGE_CHUNK:
          // 处理消息块
          if (pendingMessages.has(chunk.id)) {
            pendingMessages.get(chunk.id)?.push(chunk);
          } else {
            pendingMessages.set(chunk.id, [chunk]);
          }
          scheduleUpdate();
          break;

        case MESSAGE_TYPE.TOOL_CALL_START:
        case MESSAGE_TYPE.TOOL_CALL_CHUNK:
        case MESSAGE_TYPE.TOOL_CALL_END:
        case MESSAGE_TYPE.TOOL_RESULT:
          // 处理工具调用相关消息
          if (pendingMessages.has(chunk.id)) {
            pendingMessages.get(chunk.id)?.push(chunk);
          } else {
            pendingMessages.set(chunk.id, [chunk]);
          }
          scheduleUpdate();
          break;

        case MESSAGE_TYPE.ERROR:
          console.error('Restore chat error:', chunk.data);
          break;

        case MESSAGE_TYPE.DONE:
          // 流结束，break 让 for await 循环自然退出
          // thread 状态会在 finally 块中统一更新
          break;

        case MESSAGE_TYPE.PING:
          // 心跳消息，忽略
          break;

        default:
          console.warn('Unknown message type:', chunk);
      }
    }
  } catch (error) {
    console.error('Error restoring chat:', error);
  } finally {
    // 无论流如何结束，都获取最新的 thread 状态并更新
    // 这样可以确保 thread 状态（包括 completing status）被正确反映
    try {
      const updatedThread = await getThreadDetail(thread.uid);
      if (updatedThread.data) {
        updateThread(updatedThread.data);
      }
    } catch (updateError) {
      console.error('Error updating thread status:', updateError);
    }

    // 确保 responding 状态被正确重置
    setResponding(false);
  }
}
/**
 * 设置消息列表
 */
function setMessages(messages: StreamMessage[]) {
  useBoundStore.getState().setMessages(messages);
}

function handleMessageChunksMerged(
  chunks: (StreamMessage & { type: MESSAGE_TYPE.MESSAGE_CHUNK })[],
) {
  let message: StreamMessage | undefined;
  const mergedChunk = chunks.reduce((acc, chunk) => {
    return {
      ...acc,
      data: {
        ...acc.data,
        content: (acc.data.content ?? '') + (chunk.data.content ?? ''),
      },
    };
  });

  if (!existsMessage(mergedChunk.id)) {
    message = appendMessage(mergedChunk);
  }
  message ??= getMessage(mergedChunk.id);
  if (message) {
    message = mergeMessage(message, mergedChunk);
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
function updateMessages(messages: Map<string, StreamMessage[]>) {
  const newMessages = messages
    .entries()
    .map(([messageId, messageList]) => {
      const mergedChunk = messageList.filter(
        (chunk) => chunk.type === MESSAGE_TYPE.MESSAGE_CHUNK,
      );
      const message = handleMessageChunksMerged(mergedChunk);
      return message;
    })
    .filter((message) => message !== undefined)
    .toArray();
  useBoundStore.getState().updateMessages(newMessages);
  return newMessages;
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

// export function popMessageBuffer(messageId: string) {
//   return undefined;
// }
