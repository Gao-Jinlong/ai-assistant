import { create, StateCreator } from 'zustand';
import { createUserSlice, UserStore } from './user';
import { persist, createJSONStorage } from 'zustand/middleware';
import createRouterSlice, { RouterStore } from './router';
type UnionStore = UserStore & RouterStore;
export type Store<T> = StateCreator<UnionStore, [], [], T>;

const useBoundStore = create<UnionStore>()(
  persist(
    (...actions) => ({
      ...createUserSlice(...actions),
      ...createRouterSlice(...actions),
    }),
    { name: 'user', storage: createJSONStorage(() => localStorage) },
  ),
);

export default useBoundStore;
