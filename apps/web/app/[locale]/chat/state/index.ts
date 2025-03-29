import { atom } from 'jotai';
import { BubbleDataType } from '@ant-design/x/es/bubble/BubbleList';
import { RouterOutput } from '@web/app/trpc';
export type ConversationDto = RouterOutput['conversation']['create'];
export type ConversationState = ReturnType<typeof createConversationState>;
export const createConversationState = () => {
  const currentConversationAtom = atom<ConversationDto | undefined>(undefined);
  const localMessagesAtom = atom<BubbleDataType[]>([]);

  return {
    currentConversationAtom,
    localMessagesAtom,
  };
};
