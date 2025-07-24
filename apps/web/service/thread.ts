import { ResponseWrapper } from '.';
import { del, get, post } from './fetch';

export type MessageRole = 'user' | 'ai';

export interface ThreadDto {
  id: string;
  uid: string;
  title: string;
  messageCount: number;
  totalTokens: number;
  metadata: Record<string, any>;
  messages: MessageDto[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageDto {
  id: string;
  content: string;
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
