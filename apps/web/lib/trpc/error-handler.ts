import { TRPCClientError } from '@trpc/client';

// 定义错误类型
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION = 'VALIDATION',
  INTERNAL_SERVER = 'INTERNAL_SERVER',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  BAD_REQUEST = 'BAD_REQUEST',
  UNKNOWN = 'UNKNOWN',
}

// 错误响应接口
export interface ErrorResponse {
  code: string;
  message: string;
  data?: Record<string, any>;
}

// 处理 tRPC 错误
export function handleTRPCError(error: unknown): {
  type: ErrorType;
  message: string;
  data?: any;
} {
  if (error instanceof TRPCClientError) {
    const errorJson = error.data as ErrorResponse | undefined;
    const code = errorJson?.code || 'UNKNOWN';
    const message = errorJson?.message || error.message;

    // 根据错误代码映射错误类型
    let type: ErrorType;
    switch (code) {
      case 'UNAUTHORIZED':
      case 'UNAUTHENTICATED':
        type = ErrorType.AUTHENTICATION;
        break;
      case 'FORBIDDEN':
        type = ErrorType.AUTHORIZATION;
        break;
      case 'NOT_FOUND':
        type = ErrorType.NOT_FOUND;
        break;
      case 'CONFLICT':
        type = ErrorType.CONFLICT;
        break;
      case 'BAD_REQUEST':
        type = ErrorType.BAD_REQUEST;
        break;
      case 'PARSE_ERROR':
      case 'BAD_INPUT':
        type = ErrorType.VALIDATION;
        break;
      case 'TIMEOUT':
      case 'TIMEOUT_ERROR':
        type = ErrorType.TIMEOUT;
        break;
      case 'TOO_MANY_REQUESTS':
        type = ErrorType.RATE_LIMIT;
        break;
      case 'INTERNAL_SERVER_ERROR':
        type = ErrorType.INTERNAL_SERVER;
        break;
      default:
        type = ErrorType.UNKNOWN;
    }

    return {
      type,
      message,
      data: errorJson?.data,
    };
  }

  // 处理非 tRPC 错误
  if (error instanceof Error) {
    return {
      type: ErrorType.UNKNOWN,
      message: error.message,
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    message: 'An unknown error occurred',
  };
}

// 显示错误提示
export function showErrorToast(error: unknown, i18nMessage?: string) {
  const { message } = handleTRPCError(error);
  toast({
    variant: 'destructive',
    title: '错误',
    description: i18nMessage || message,
  });
}
