import { MESSAGE_TYPE, MessageChunkDto, ThreadDto } from '@web/service/thread';
import { Store } from '.';
import { nanoid } from 'nanoid';
export interface CurrentThreadStoreState {
  currentThread: ThreadDto | null;
  messageList: MessageChunkDto[];
  isResponding: boolean;
}
export interface CurrentThreadStoreActions {
  clearCurrent: () => void;
  setCurrentThread: (current: ThreadDto | null) => void;
  setIsResponding: (isResponding: boolean) => void;
  appendMessage: (message: MessageChunkDto) => void;
  sendMessage: (message: string) => void;
  setMessageList: (messageList: MessageChunkDto[]) => void;
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

    if (message.id && lastMessage?.groupId === message.groupId) {
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
          id: nanoid(),
          type: MESSAGE_TYPE.MESSAGE_CHUNK,
          groupId: get().currentThread?.uid ?? '',
          data: {
            content: message,
          },
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

function mergeMessage(
  lastMessage: MessageChunkDto,
  message: MessageChunkDto,
): MessageChunkDto {
  const { data, updatedAt } = message;

  const mergedMessage = {
    ...lastMessage,
    updatedAt,
  };
  mergedMessage.data.content += data.content;

  return mergedMessage;
}
