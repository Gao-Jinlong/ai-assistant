import { create, StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createUserSlice, UserStore } from './user';
import { createRouterSlice, RouterStore } from './router';
import { createThreadSlice, ThreadStore } from './thread';

type UnionStore = UserStore & RouterStore & ThreadStore;
export type Store<T> = StateCreator<UnionStore, [], [], T>;

const useBoundStore = create<UnionStore>()(
  persist(
    (...actions) => ({
      ...createUserSlice(...actions),
      ...createRouterSlice(...actions),
      ...createThreadSlice(...actions),
    }),
    {
      name: 'user',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        loginInfo: state.loginInfo,
      }),
    },
  ),
);

export default useBoundStore;
