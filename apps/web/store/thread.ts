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
  sendMessage: (message: string) => void;
}

export interface ThreadStore extends ThreadStoreState, ThreadStoreActions {}

const mockThreads: ThreadDto[] = [
  {
    id: '1',
    uid: '1',
    title: 'Thread 1',
    totalTokens: 100,
    messageCount: 10,
    messages: [
      {
        id: '1',
        threadId: '1',
        content: 'Hello, world!',
        role: 'user',
        createdAt: '2021-01-01',
        updatedAt: '2021-01-01',
      },
      {
        id: '2',
        threadId: '1',
        content: 'Hello, world!',
        role: 'ai',
        createdAt: '2021-01-01',
        updatedAt: '2021-01-01',
      },
    ],
    createdAt: '2021-01-01',
    updatedAt: '2021-01-01',
  },
  {
    id: '2',
    uid: '2',
    title: 'Thread 2',
    totalTokens: 200,
    messageCount: 20,
    messages: [],
    createdAt: '2021-01-01',
    updatedAt: '2021-01-01',
  },
  {
    id: '3',
    uid: '3',
    title: 'Thread 3',
    totalTokens: 300,
    messageCount: 30,
    messages: [],
    createdAt: '2021-01-01',
    updatedAt: '2021-01-01',
  },
];

const createThreadSlice: Store<ThreadStore> = (set, get, store) => ({
  isResponding: false,
  threads: mockThreads,
  currentThread: mockThreads[0],
  messageList: [],
  sendMessage: (message) => {
    set({ isResponding: true });
    set({
      messageList: [
        ...get().messageList,
        {
          id: nanoid(),
          threadId: get().currentThread?.id ?? '',
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
});

export { createThreadSlice };
