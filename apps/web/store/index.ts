import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createUserSlice, UserStore } from './user';
import { createRouterSlice, RouterStore } from './router';
import { createActiveThreadSlice, ActiveThreadStore } from './active-thread';
import { LOGIN_INFO_KEY } from '@web/constant';
import { createThreadsSlice, ThreadsStore } from './threads';

type UnionStore = UserStore & RouterStore & ActiveThreadStore & ThreadsStore;
export type Store<T> = StateCreator<UnionStore, [], [], T>;

const useBoundStore = create<UnionStore>()(
  persist(
    (...actions) => ({
      ...createUserSlice(...actions),
      ...createRouterSlice(...actions),
      ...createActiveThreadSlice(...actions),
      ...createThreadsSlice(...actions),
    }),
    {
      name: LOGIN_INFO_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        loginInfo: state.loginInfo,
      }),
    },
  ),
);

export default useBoundStore;
