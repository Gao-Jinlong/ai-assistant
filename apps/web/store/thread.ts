import { MessageDto, ThreadDto } from '@web/service/thread';
import { Store } from '.';
import { nanoid } from 'nanoid';
export interface ThreadStoreState {
  threads: ThreadDto[];
  currentThread: ThreadDto | null;
  messageList: MessageDto[];
  isResponding: boolean;
}
export interface ThreadStoreActions {
  setThreads: (threads: ThreadDto[]) => void;
  setCurrentThread: (current: ThreadDto | null) => void;
  setIsResponding: (isResponding: boolean) => void;
  appendMessage: (message: MessageDto) => void;
  sendMessage: (message: string) => void;
  deleteThread: (thread: ThreadDto) => void;
}

export interface ThreadStore extends ThreadStoreState, ThreadStoreActions {}

const createThreadSlice: Store<ThreadStore> = (set, get, store) => ({
  isResponding: false,
  threads: [],
  currentThread: null,
  messageList: [],
  appendMessage: (message) => {
    set({
      messageList: [...get().messageList, message],
    });
  },
  sendMessage: (message) => {
    set({
      messageList: [
        ...get().messageList,
        {
          id: nanoid(),
          content: message,
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
  },
  setThreads: (threads) => set({ threads }),
  setCurrentThread: (current) => set({ currentThread: current }),
  setIsResponding: (isResponding) => set({ isResponding }),
  deleteThread: (thread) => {
    set({
      threads: get().threads.filter((t) => t.id !== thread.id),
    });
  },
});

export { createThreadSlice };
