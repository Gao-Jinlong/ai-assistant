import { ResponseWrapper } from '.';
import { del, get, post } from './fetch';

export type MessageRole = 'user' | 'assistant';
export enum MESSAGE_TYPE {
  MESSAGE_CHUNK = 'message_chunk',
}

export interface ThreadDto {
  id: string;
  uid: string;
  title: string;
  messageCount: number;
  totalTokens: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface MessageChunkDto {
  id: string;
  groupId: string;
  data: {
    content: string;
  };
  type: MESSAGE_TYPE;
  role: MessageRole;
  createdAt: string;
  updatedAt: string;
}
export const getThreads = () => {
  return get<ResponseWrapper<ThreadDto[]>>('thread');
};

export const createThread = () => {
  return post<ResponseWrapper<ThreadDto>>('thread');
};

export const deleteThread = (id: string) => {
  return del<ResponseWrapper<ThreadDto>>(`thread/${id}`);
};

export const getThreadMessages = (id: ThreadDto['id']) => {
  return get<ResponseWrapper<MessageChunkDto[]>>(`thread/${id}/messages`);
};
