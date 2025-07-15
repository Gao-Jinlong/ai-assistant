import { del, get, post, put } from './fetch';
export interface User {
  id: string;
  email: string;
  password: string;
}
export interface RegisterData extends Pick<User, 'email' | 'password'> {}
export interface LoginData extends Pick<User, 'email' | 'password'> {}
export const getUser = async () => {
  const user = await get('user');
  return user;
};

export const register = async (data: RegisterData) => {
  const user = await post('user/register', {
    json: data,
  });
  return user;
};

export const login = async (data: LoginData) => {
  const user = await post('user/login', {
    json: data,
  });
  return user;
};

export const logout = async () => {
  const user = await post('user/logout');
  return user;
};

export const update = async (data: any) => {
  const user = await put('user/update', data);
  return user;
};

export const remove = async (data: any) => {
  const user = await del('user/remove', data);
  return user;
};
