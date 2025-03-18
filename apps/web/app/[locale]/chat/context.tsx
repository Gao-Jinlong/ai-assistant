'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { trpc } from '@web/app/trpc';
import { Conversation } from '@ant-design/x/es/conversations';
import dayjs from 'dayjs';
import { message } from 'antd';
export type ConversationContextType = {
  query: ReturnType<typeof trpc.conversation.findAll.useQuery>;
  create: ReturnType<typeof trpc.conversation.create.useMutation>;
  list: Conversation[];
  remove: ReturnType<typeof trpc.conversation.remove.useMutation>;
};

export const ConversationContext =
  createContext<ConversationContextType | null>(null);

export const ConversationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const query = trpc.conversation.findAll.useQuery();
  const create = trpc.conversation.create.useMutation();
  const remove = trpc.conversation.remove.useMutation();

  useEffect(() => {
    query.refetch();
  }, []);

  const list = useMemo(() => {
    const data: Conversation[] =
      query.data?.map((item) => ({
        group: dayjs(item.createdAt).format('YYYY-MM-DD'),
        label: item.title,
        key: item.uid,
        timestamp: dayjs(item.createdAt).unix(),
        data: item,
      })) || [];
    return data;
  }, [query.data]);

  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);

  return (
    <ConversationContext.Provider value={{ query, create, list, remove }}>
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
