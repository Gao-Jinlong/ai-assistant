import { create, StateCreator } from 'zustand';
import { createUserSlice, UserStore } from './user';
import { persist, createJSONStorage } from 'zustand/middleware';
type UnionStore = UserStore;
export type Store<T> = StateCreator<UnionStore, [], [], T>;

const useBoundStore = create<UnionStore>()(
  persist(
    (...actions) => ({
      ...createUserSlice(...actions),
    }),
    { name: 'user', storage: createJSONStorage(() => localStorage) },
  ),
);

export default useBoundStore;
