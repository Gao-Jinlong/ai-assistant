import { TRPCClientError } from '@trpc/client';
import { trpc } from '../app/trpc';

const USER_PAYLOAD_KEY = 'userPayload';

export type AuthResult = ResponseError | AuthSuccess;

export interface ResponseError {
  type: 'error';
  message: string;
}

export interface AuthSuccess {
  type: 'success';
  message: string;
  data: Awaited<ReturnType<typeof trpc.user.login.mutate>>;
}
export type RegisterResult = ResponseError | RegisterSuccess;
export interface RegisterSuccess {
  type: 'success';
  message: string;
  data: Awaited<ReturnType<typeof trpc.user.register.mutate>>;
}
export class AuthService {
  // TODO 重构接口解析
  static async login(email: string, password: string, rememberMe = false) {
    try {
      const loginResult = await trpc.user.login.useMutation().mutate({
        email,
        password,
      });

      // 保存token
      if (rememberMe) {
        localStorage.setItem(USER_PAYLOAD_KEY, JSON.stringify(loginResult));
      } else {
        sessionStorage.setItem(USER_PAYLOAD_KEY, JSON.stringify(loginResult));
      }

      return {
        type: 'success',
        message: '登录成功！',
        data: loginResult,
      } satisfies AuthSuccess;
    } catch (error) {
      console.error('登录失败:', error);
      return this.handleAuthError(error);
    }
  }

  static async register(
    email: string,
    password: string,
  ): Promise<RegisterResult> {
    try {
      const result = await trpc.user.register.useMutation().mutate({
        email,
        password,
      });

      return {
        type: 'success',
        message: '注册成功！',
        data: result,
      } satisfies RegisterSuccess;
    } catch (error) {
      console.error('注册失败:', error);
      return this.handleAuthError(error);
    }
  }

  static getUserPayload() {
    const userPayload =
      sessionStorage.getItem(USER_PAYLOAD_KEY) ||
      localStorage.getItem(USER_PAYLOAD_KEY);
    if (userPayload) {
      return JSON.parse(userPayload);
    }
    return null;
  }

  static logout() {
    localStorage.removeItem(USER_PAYLOAD_KEY);
    sessionStorage.removeItem(USER_PAYLOAD_KEY);
    window.location.href = '/';
  }

  private static handleAuthError(error: unknown) {
    let result: ResponseError = {
      type: 'error',
      message: '操作失败，请稍后重试',
    };

    if (error instanceof TRPCClientError) {
      result.message = error.message;
    }
    return result;
  }
}
