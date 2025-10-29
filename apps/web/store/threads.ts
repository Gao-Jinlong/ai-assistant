import { ThreadVO } from '@web/service/thread';
import { Store } from '.';

export interface ThreadsStoreState {
  threads: ThreadVO[];
}

export interface ThreadsStoreActions {
  setThreads: (threads: ThreadVO[]) => void;
  deleteThread: (thread: ThreadVO) => void;
}

export interface ThreadsStore extends ThreadsStoreState, ThreadsStoreActions {}

const createThreadsSlice: Store<ThreadsStore> = (set, get, store) => ({
  threads: [],
  setThreads: (threads) => {
    threads.sort((a, b) => {
      if (a.updatedAt && b.updatedAt) {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      return 0;
    });
    set({ threads });
  },
  deleteThread: (thread) => {
    set({
      threads: get().threads.filter((t) => t.id !== thread.id),
    });
  },
});

export { createThreadsSlice };
