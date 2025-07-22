import { ResponseWrapper } from '.';
import { get } from './fetch';

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
  threadId?: string;
  content: string;
  role: MessageRole;
  createdAt: string;
  updatedAt: string;
}
export const getThreads = async () => {
  const threads = await get<ResponseWrapper<ThreadDto[]>>('thread');
  return threads;
};
