import { MESSAGE_TYPE, type MESSAGE_ROLE } from '../chat.interface';

/**
 * 统一 SSE 消息格式
 */
export type SSEMessage =
  | {
      type: MESSAGE_TYPE.PING;
      data: null;
      metadata?: MessageMetadata;
      error?: StructuredError;
    }
  | {
      type: MESSAGE_TYPE.ERROR;
      data: null;
      metadata?: MessageMetadata;
      error?: StructuredError;
    }
  | {
      type: MESSAGE_TYPE.MESSAGE_START;
      data: MessageStartData;
      metadata?: MessageMetadata;
      error?: StructuredError;
    }
  | {
      type: MESSAGE_TYPE.MESSAGE_END;
      data: MessageEndData;
      metadata?: MessageMetadata;
      error?: StructuredError;
    }
  | {
      type: MESSAGE_TYPE.MESSAGE_CHUNK;
      data: MessageChunkData;
      metadata?: MessageMetadata;
      error?: StructuredError;
    }
  | {
      type: MESSAGE_TYPE.DONE;
      data: null;
      metadata?: MessageMetadata;
      error?: StructuredError;
    }
  | {
      type: MESSAGE_TYPE.TOOL_CALL_START;
      data: ToolCallStartData;
      metadata?: MessageMetadata;
      error?: StructuredError;
    }
  | {
      type: MESSAGE_TYPE.TOOL_CALL_CHUNK;
      data: ToolCallChunkData;
      metadata?: MessageMetadata;
      error?: StructuredError;
    }
  | {
      type: MESSAGE_TYPE.TOOL_CALL_END;
      data: ToolCallEndData;
      metadata?: MessageMetadata;
      error?: StructuredError;
    }
  | {
      type: MESSAGE_TYPE.TOOL_RESULT;
      data: ToolResultData;
      metadata?: MessageMetadata;
      error?: StructuredError;
    };

/**
 * 消息元数据
 */
export interface MessageMetadata {
  /**
   * 消息块索引
   */
  messageChunkIndex?: number;
  /**
   * 消息组ID(同一轮对话)
   */
  groupId?: string;
  /**
   * 时间戳
   */
  timestamp: number;
  /**
   * 使用的模型
   */
  model?: string;
  /**
   * Token使用情况
   */
  usage?: TokenUsage;
  /**
   * 延迟(ms)
   */
  latency?: number;
}

/**
 * Token使用情况
 */
export interface TokenUsage {
  promptTokens?: number; // 输入token数
  completionTokens?: number; // 输出token数
  totalTokens?: number; // 总token数
}

/**
 * 结构化错误
 */
export interface StructuredError {
  code: string; // 错误码
  message: string; // 错误消息
  details?: Record<string, unknown>; // 错误详情
  stack?: string; // 堆栈信息(仅开发环境)
}

/**
 * 文本消息块数据
 */
export interface MessageChunkData {
  content: string; // 文本内容
  role: MESSAGE_ROLE; // 角色
}

/**
 * 消息开始数据
 */
export interface MessageStartData {
  role: MESSAGE_ROLE.ASSISTANT;
}

/**
 * 消息结束数据
 */
export interface MessageEndData {
  role: MESSAGE_ROLE.ASSISTANT;
  finishReason: 'stop' | 'length' | 'tool_calls';
  usage: TokenUsage; // 完整的token统计
}

/**
 * 工具调用开始数据
 */
export interface ToolCallStartData {
  toolCallId: string; // 工具调用ID
  toolName: string; // 工具名称
}

/**
 * 工具调用块数据
 */
export interface ToolCallChunkData {
  toolCallId: string;
  argsChunk: string; // 参数JSON片段
  index: number; // 块索引
}

/**
 * 工具调用结束数据
 */
export interface ToolCallEndData {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>; // 完整参数对象
}

/**
 * 工具执行结果数据
 */
export interface ToolResultData {
  toolCallId: string;
  toolName: string;
  result: unknown; // 工具返回结果
  error?: string; // 执行错误(如有)
}

/**
 * 思考过程块数据(预留)
 */
export interface ReasoningChunkData {
  content: string; // 思考内容
  step?: number; // 思考步骤
}
