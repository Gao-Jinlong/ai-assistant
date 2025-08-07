export * from './fetch';
export * as userService from './user';
export * as threadService from './thread';
export * as chatService from './chat';

export interface ResponseWrapper<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponseWrapper<T> extends ResponseWrapper<T> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
