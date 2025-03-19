'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { trpc } from '@web/app/trpc';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from 'usehooks-ts';

export type LoginDto = Parameters<
  ReturnType<typeof trpc.user.login.useMutation>['mutate']
>[0];
export type RegisterDto = Parameters<
  ReturnType<typeof trpc.user.register.useMutation>['mutate']
>[0];
export type UsePayload = ReturnType<typeof trpc.user.login.useMutation>['data'];

export type RegisterPayload = ReturnType<
  typeof trpc.user.register.useMutation
>['data'];

interface AuthContextType {
  payload: UsePayload | null;
  loading: boolean;
  logout: () => void;
  login: (params: LoginDto) => Promise<UsePayload | undefined>;
  register: (params: RegisterDto) => Promise<RegisterPayload | undefined>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const USER_PAYLOAD_KEY = 'userPayload';
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [storage, setStorage] = useLocalStorage<UsePayload | null>(
    USER_PAYLOAD_KEY,
    null,
  );

  const userMutation = trpc.user.login.useMutation({
    onSuccess: (data) => {
      setStorage(data);
      return data;
    },
  });

  const registerMutation = trpc.user.register.useMutation();

  const login = useCallback(async (params: LoginDto) => {
    if (typeof window === 'undefined') return;

    const result = await userMutation?.mutateAsync(params);
    setStorage(result);
    return result;
  }, []);

  const logout = useCallback(() => {
    if (typeof window === 'undefined') return;

    userMutation?.reset();
    setStorage(null);
    router.push('/');
  }, []);

  const register = useCallback(async (params: RegisterDto) => {
    if (typeof window === 'undefined') return;

    await registerMutation.mutateAsync(params);

    return registerMutation.data;
  }, []);

  const finalUserPayload = useMemo(() => {
    return userMutation?.data ?? storage;
  }, [userMutation?.data, storage]);

  const value = {
    payload: finalUserPayload,
    loading: userMutation?.isLoading || false,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function getUserPayload() {
  if (typeof window === 'undefined') return null;

  try {
    const userPayload = localStorage.getItem(USER_PAYLOAD_KEY);
    return userPayload ? JSON.parse(userPayload) : null;
  } catch (error) {
    console.error('getUserPayload error:', error);
    return null;
  }
}
