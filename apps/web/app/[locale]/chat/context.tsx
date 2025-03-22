'use client';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  Dispatch,
  SetStateAction,
} from 'react';
import { trpc } from '@web/app/trpc';
import dayjs from 'dayjs';
import { IConversation } from './interface';
export type ConversationContextType = {
  query: ReturnType<typeof trpc.conversation.findAll.useMutation>;
  create: ReturnType<typeof trpc.conversation.create.useMutation>;
  list: IConversation[];
  remove: ReturnType<typeof trpc.conversation.remove.useMutation>;
  currentKey: string | undefined;
  setCurrentKey: Dispatch<SetStateAction<string | undefined>>;
  currentConversation: IConversation | undefined;
};

export const ConversationContext =
  createContext<ConversationContextType | null>(null);

export const ConversationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // FIXME useMutation 可以正确推理类型， useQuery 不能
  const query = trpc.conversation.findAll.useMutation();
  const create = trpc.conversation.create.useMutation();
  const remove = trpc.conversation.remove.useMutation();

  useEffect(() => {
    query.mutate();
  }, []);

  const list = useMemo(() => {
    const data: IConversation[] =
      query.data?.map((item) => ({
        group: dayjs(item.createdAt).format('YYYY-MM-DD'),
        label: item.title,
        key: item.uid,
        timestamp: dayjs(item.createdAt).unix(),
        data: item,
      })) || [];
    return data;
  }, [query.data]);

  const [currentKey, setCurrentKey] = useState<string>();

  const currentConversation = useMemo(() => {
    return list.find((item) => item.key === currentKey);
  }, [currentKey, list]);

  return (
    <ConversationContext.Provider
      value={{
        query,
        create,
        list,
        remove,
        currentKey,
        setCurrentKey,
        currentConversation,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error(
      'useConversation must be used within a ConversationProvider',
    );
  }
  return context;
};
