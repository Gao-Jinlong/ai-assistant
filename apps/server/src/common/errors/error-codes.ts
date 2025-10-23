/**
 * 错误码定义
 */
export enum ErrorCode {
  // 通用错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // 认证相关
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // 业务逻辑错误
  THREAD_NOT_FOUND = 'THREAD_NOT_FOUND',
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
  INVALID_MESSAGE_FORMAT = 'INVALID_MESSAGE_FORMAT',

  // 模型相关错误
  MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE',
  MODEL_RATE_LIMIT = 'MODEL_RATE_LIMIT',
  MODEL_TIMEOUT = 'MODEL_TIMEOUT',

  // 工具调用错误
  TOOL_CALL_FAILED = 'TOOL_CALL_FAILED',
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
  TOOL_VALIDATION_ERROR = 'TOOL_VALIDATION_ERROR',

  // 流处理错误
  STREAM_ERROR = 'STREAM_ERROR',
  SSE_FORMAT_ERROR = 'SSE_FORMAT_ERROR',
  MESSAGE_PROCESSING_ERROR = 'MESSAGE_PROCESSING_ERROR',
}

/**
 * 错误信息映射
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.UNKNOWN_ERROR]: '未知错误',
  [ErrorCode.INTERNAL_SERVER_ERROR]: '内部服务器错误',
  [ErrorCode.VALIDATION_ERROR]: '参数验证错误',
  [ErrorCode.UNAUTHORIZED]: '未授权访问',
  [ErrorCode.TOKEN_EXPIRED]: 'Token已过期',
  [ErrorCode.INVALID_TOKEN]: '无效的Token',
  [ErrorCode.THREAD_NOT_FOUND]: '对话线程不存在',
  [ErrorCode.MESSAGE_NOT_FOUND]: '消息不存在',
  [ErrorCode.INVALID_MESSAGE_FORMAT]: '消息格式无效',
  [ErrorCode.MODEL_UNAVAILABLE]: '模型不可用',
  [ErrorCode.MODEL_RATE_LIMIT]: '模型请求频率超限',
  [ErrorCode.MODEL_TIMEOUT]: '模型请求超时',
  [ErrorCode.TOOL_CALL_FAILED]: '工具调用失败',
  [ErrorCode.TOOL_NOT_FOUND]: '工具不存在',
  [ErrorCode.TOOL_VALIDATION_ERROR]: '工具参数验证失败',
  [ErrorCode.STREAM_ERROR]: '流处理错误',
  [ErrorCode.SSE_FORMAT_ERROR]: 'SSE格式错误',
  [ErrorCode.MESSAGE_PROCESSING_ERROR]: '消息处理错误',
};

/**
 * 创建结构化错误
 */
export function createStructuredError(
  code: ErrorCode,
  message?: string,
  details?: Record<string, unknown>,
  stack?: string,
) {
  return {
    code,
    message: message || ErrorMessages[code],
    details,
    stack,
  };
}
