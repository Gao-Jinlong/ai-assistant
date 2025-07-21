import * as fetch from './fetch';
import * as user from './user';
import * as thread from './thread';

const service = {
  fetch,
  user,
  thread,
};

export default service;

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
