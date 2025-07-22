import { ResponseWrapper } from '.';
import { del, get, post, put } from './fetch';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  nickname: string;
  avatar: string;
}
export interface LoginResponse {
  user: User;
  token: {
    access_token: string;
  };
}
export interface RegisterData extends Pick<User, 'email' | 'password'> {}
export interface LoginData extends Pick<User, 'email' | 'password'> {}
export const getUser = async () => {
  const user = await get<ResponseWrapper<User>>('user');
  return user;
};

export const register = async (data: RegisterData) => {
  const user = await post<ResponseWrapper<User>>('user/register', {
    json: data,
  });
  return user;
};

export const login = async (data: LoginData) => {
  const user = await post<ResponseWrapper<LoginResponse>>('user/login', {
    json: data,
  });
  return user;
};

export const logout = async () => {
  const user = await post<ResponseWrapper<null>>('user/logout');
  return user;
};

export const update = async (data: any) => {
  const user = await put<ResponseWrapper<User>>('user/update', {
    json: data,
  });
  return user;
};

export const remove = async (data: any) => {
  const user = await del<ResponseWrapper<null>>('user/remove', {
    json: data,
  });
  return user;
};
