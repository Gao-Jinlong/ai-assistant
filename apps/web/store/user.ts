import { LoginResponse } from '@web/service/user';
import { Store } from '.';

export interface UserStoreState {
  loginInfo: LoginResponse | null;
}
export interface UserStoreActions {
  setLoginInfo: (info: LoginResponse) => void;
  clearLoginInfo: () => void;
  isAuthenticated: () => boolean;
}

export interface UserStore extends UserStoreState, UserStoreActions {}

const createUserSlice: Store<UserStore> = (set, get, store) => ({
  loginInfo: null,

  setLoginInfo: (info: LoginResponse) => set({ loginInfo: info }),
  clearLoginInfo: () => set({ loginInfo: null }),
  isAuthenticated: () => get().loginInfo !== null,
});

export { createUserSlice };
