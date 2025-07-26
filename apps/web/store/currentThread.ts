import { MessageDto, ThreadDto } from '@web/service/thread';
import { Store } from '.';
import { nanoid } from 'nanoid';
export interface CurrentThreadStoreState {
  currentThread: ThreadDto | null;
  messageList: MessageDto[];
  isResponding: boolean;
}
export interface CurrentThreadStoreActions {
  clearCurrent: () => void;
  setCurrentThread: (current: ThreadDto | null) => void;
  setIsResponding: (isResponding: boolean) => void;
  appendMessage: (message: MessageDto) => void;
  sendMessage: (message: string) => void;
  setMessageList: (messageList: MessageDto[]) => void;
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
  setCurrentThread: (current) => set({ currentThread: current }),
  setIsResponding: (isResponding) => set({ isResponding }),
  setMessageList: (messageList) => set({ messageList }),
});

export { createThreadSlice as createCurrentThreadSlice };
