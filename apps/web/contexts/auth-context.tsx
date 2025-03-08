'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { AuthResult, AuthService, RegisterResult } from '@web/lib/auth';
import { trpc } from '@web/app/trpc';
import { useRouter } from 'next/navigation';
type LoginDto = Parameters<typeof AuthService.login>;
type RegisterDto = Parameters<typeof AuthService.register>;
type UsePayload = Awaited<ReturnType<typeof trpc.user.login.useMutation>>;

interface AuthContextType {
  payload: UsePayload | null;
  loading: boolean;
  getUserPayload: () => UsePayload | null;
  logout: () => void;
  login: (...args: LoginDto) => Promise<AuthResult | undefined>;
  register: (...args: RegisterDto) => Promise<RegisterResult | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function InnerAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [payload, setPayload] = useState<UsePayload | null>(null);
  const [loading, setLoading] = useState(false);

  const getUserPayload = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (payload) return payload;

    const userPayload = AuthService.getUserPayload();
    if (userPayload) {
      setPayload(userPayload);
    }

    return userPayload;
  }, []);

  const login = useCallback(async (...args: LoginDto) => {
    if (typeof window === 'undefined') return;

    const result = await AuthService.login(...args);

    if (result.type === 'success') {
      setPayload(result.data);
    }

    return result;
  }, []);

  const logout = useCallback(() => {
    if (typeof window === 'undefined') return;
    AuthService.logout();
    setPayload(null);
    router.push('/');
  }, []);

  const register = useCallback(async (...args: RegisterDto) => {
    if (typeof window === 'undefined') return;

    const result = await AuthService.register(...args);

    return result;
  }, []);

  // 初始化时加载用户信息
  useEffect(() => {
    const loadUser = () => {
      setLoading(true);
      try {
        const storedPayload = AuthService.getUserPayload();
        if (storedPayload) {
          setPayload(storedPayload);
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      loadUser();
    }
  }, []);

  const value = {
    payload,
    loading,
    getUserPayload,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const AuthPrfovider = trpc.withTRPC(InnerAuthProvider);

export { AuthProvider };
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
