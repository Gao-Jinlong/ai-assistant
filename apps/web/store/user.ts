import { LoginResponse } from '@web/service/user';
import { Store } from '.';

export interface UserStoreState {
  user: LoginResponse | null;
}
export interface UserStoreActions {
  setUser: (user: LoginResponse) => void;
  clearUser: () => void;
  isAuthenticated: () => boolean;
}

export interface UserStore extends UserStoreState, UserStoreActions {}

const createUserSlice: Store<UserStore> = (set, get, store) => ({
  user: null,

  setUser: (user: LoginResponse) => set({ user }),
  clearUser: () => set({ user: null }),
  isAuthenticated: () => get().user !== null,
});

export { createUserSlice };
