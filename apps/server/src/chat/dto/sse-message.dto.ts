import { MESSAGE_TYPE } from '../chat.interface';

/**
 * 统一 SSE 消息格式
 */
export interface SSEMessage<T = unknown> {
  type: MESSAGE_TYPE; // 消息类型
  data: T; // 消息数据(根据type不同而不同)
  metadata?: MessageMetadata; // 元数据(可选)
  error?: StructuredError; // 错误信息(仅type=ERROR时)
}

/**
 * 消息元数据
 */
export interface MessageMetadata {
  messageId?: string; // 消息ID
  groupId?: string; // 消息组ID(同一轮对话)
  timestamp: number; // 时间戳
  model?: string; // 使用的模型
  usage?: TokenUsage; // Token使用情况
  latency?: number; // 延迟(ms)
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
  role: 'user' | 'assistant'; // 角色
  index?: number; // 块索引
}

/**
 * 消息开始数据
 */
export interface MessageStartData {
  role: 'assistant';
  model: string; // 使用的模型
}

/**
 * 消息结束数据
 */
export interface MessageEndData {
  role: 'assistant';
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
