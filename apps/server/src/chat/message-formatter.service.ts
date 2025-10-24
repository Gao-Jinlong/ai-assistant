import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Inject } from '@nestjs/common';
import { nanoid } from 'nanoid';
import {
  AIMessageChunk,
  BaseMessage,
  ToolCall,
} from '@langchain/core/messages';
import { MESSAGE_ROLE, MESSAGE_TYPE } from './chat.interface';
import {
  SSEMessage,
  MessageChunkData,
  MessageStartData,
  MessageEndData,
  ToolCallStartData,
  ToolCallChunkData,
  ToolCallEndData,
  ToolResultData,
  MessageMetadata,
  StructuredError,
} from './dto/sse-message.dto';
import { MessageMetadataBuilder } from './dto/message-metadata.dto';
import {
  ErrorCode,
  createStructuredError,
} from '@server/common/errors/error-codes';

/**
 * 消息格式化服务
 * 负责将 LangChain 的消息块转换为统一的 SSE 消息格式
 */
@Injectable()
export class MessageFormatterService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * 格式化文本消息块
   */
  formatMessageChunk(
    chunk: AIMessageChunk,
    metadata: Partial<MessageMetadata>,
  ): SSEMessage<MessageChunkData> {
    const messageMetadata = new MessageMetadataBuilder().updateTimestamp();

    if (metadata) {
      if (metadata.messageChunkIndex)
        messageMetadata.setMessageId(metadata.messageChunkIndex);
      if (metadata.groupId) messageMetadata.setGroupId(metadata.groupId);
      if (metadata.model) messageMetadata.setModel(metadata.model);
      if (metadata.usage) messageMetadata.setUsage(metadata.usage);
      if (metadata.latency) messageMetadata.setLatency(metadata.latency);
    }

    return {
      type: MESSAGE_TYPE.MESSAGE_CHUNK,
      data: {
        content: chunk.content.toString(),
        role: MESSAGE_ROLE.ASSISTANT,
      },
      metadata: messageMetadata.build(),
    };
  }

  /**
   * 格式化消息开始事件
   */
  formatMessageStart(metadata: Partial<MessageMetadata>): SSEMessage {
    const messageMetadata = new MessageMetadataBuilder().updateTimestamp();

    if (metadata) {
      if (metadata.groupId) messageMetadata.setGroupId(metadata.groupId);
      if (metadata.usage) messageMetadata.setUsage(metadata.usage);
    }

    return {
      type: MESSAGE_TYPE.MESSAGE_START,
      data: {
        role: MESSAGE_ROLE.ASSISTANT,
      },
      metadata: messageMetadata.build(),
    };
  }

  /**
   * 格式化消息结束事件
   */
  formatMessageEnd(
    finishReason: 'stop' | 'length' | 'tool_calls',
    usage: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    },
    metadata?: Partial<MessageMetadata>,
  ): SSEMessage<MessageEndData> {
    const messageMetadata = new MessageMetadataBuilder()
      .setUsage(usage)
      .updateTimestamp();

    if (metadata) {
      if (metadata.groupId) messageMetadata.setGroupId(metadata.groupId);
      if (metadata.model) messageMetadata.setModel(metadata.model);
      if (metadata.latency) messageMetadata.setLatency(metadata.latency);
    }

    return {
      type: MESSAGE_TYPE.MESSAGE_END,
      data: {
        role: MESSAGE_ROLE.ASSISTANT,
        finishReason,
        usage,
      },
      metadata: messageMetadata.build(),
    };
  }

  /**
   * 格式化工具调用开始事件
   */
  formatToolCallStart(
    toolCall: ToolCall,
    metadata?: Partial<MessageMetadata>,
  ): SSEMessage<ToolCallStartData> {
    const messageMetadata = new MessageMetadataBuilder()
      .setMessageId(metadata?.messageChunkIndex || 0)
      .updateTimestamp();

    if (metadata) {
      if (metadata.groupId) messageMetadata.setGroupId(metadata.groupId);
      if (metadata.model) messageMetadata.setModel(metadata.model);
    }

    return {
      type: MESSAGE_TYPE.TOOL_CALL_START,
      data: {
        toolCallId: toolCall.id || nanoid(),
        toolName: toolCall.name,
      },
      metadata: messageMetadata.build(),
    };
  }

  /**
   * 格式化工具调用参数块
   */
  formatToolCallChunk(
    toolCallId: string,
    argsChunk: string,
    index: number,
    metadata?: Partial<MessageMetadata>,
  ): SSEMessage<ToolCallChunkData> {
    const messageMetadata = new MessageMetadataBuilder()
      .setMessageId(metadata?.messageChunkIndex || 0)
      .updateTimestamp();

    if (metadata) {
      if (metadata.groupId) messageMetadata.setGroupId(metadata.groupId);
      if (metadata.model) messageMetadata.setModel(metadata.model);
    }

    return {
      type: MESSAGE_TYPE.TOOL_CALL_CHUNK,
      data: {
        toolCallId,
        argsChunk,
        index,
      },
      metadata: messageMetadata.build(),
    };
  }

  /**
   * 格式化工具调用结束事件
   */
  formatToolCallEnd(
    toolCall: ToolCall,
    metadata?: Partial<MessageMetadata>,
  ): SSEMessage<ToolCallEndData> {
    const messageMetadata = new MessageMetadataBuilder()
      .setMessageId(metadata?.messageChunkIndex || 0)
      .updateTimestamp();

    if (metadata) {
      if (metadata.groupId) messageMetadata.setGroupId(metadata.groupId);
      if (metadata.model) messageMetadata.setModel(metadata.model);
    }

    return {
      type: MESSAGE_TYPE.TOOL_CALL_END,
      data: {
        toolCallId: toolCall.id || nanoid(),
        toolName: toolCall.name,
        args: toolCall.args,
      },
      metadata: messageMetadata.build(),
    };
  }

  /**
   * 格式化工具执行结果
   */
  formatToolResult(
    toolCallId: string,
    toolName: string,
    result: unknown,
    error?: string,
    metadata?: Partial<MessageMetadata>,
  ): SSEMessage<ToolResultData> {
    const messageMetadata = new MessageMetadataBuilder()
      .setMessageId(metadata?.messageChunkIndex || 0)
      .updateTimestamp();

    if (metadata) {
      if (metadata.groupId) messageMetadata.setGroupId(metadata.groupId);
      if (metadata.model) messageMetadata.setModel(metadata.model);
    }

    return {
      type: MESSAGE_TYPE.TOOL_RESULT,
      data: {
        toolCallId,
        toolName,
        result,
        error,
      },
      metadata: messageMetadata.build(),
    };
  }

  /**
   * 格式化错误消息
   */
  formatError(
    error: Error | string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    details?: Record<string, unknown>,
    metadata?: Partial<MessageMetadata>,
  ): SSEMessage<never> {
    const messageMetadata = new MessageMetadataBuilder().updateTimestamp();

    if (metadata) {
      if (metadata.groupId) messageMetadata.setGroupId(metadata.groupId);
      if (metadata.model) messageMetadata.setModel(metadata.model);
    }

    const structuredError: StructuredError =
      typeof error === 'string'
        ? createStructuredError(code, error, details)
        : createStructuredError(
            code,
            error.message,
            { ...details, originalError: error.name },
            error.stack,
          );

    return {
      type: MESSAGE_TYPE.ERROR,
      data: {} as never,
      metadata: messageMetadata.build(),
      error: structuredError,
    };
  }

  /**
   * 格式化流结束消息
   */
  formatDone(metadata?: Partial<MessageMetadata>): SSEMessage<never> {
    const messageMetadata = new MessageMetadataBuilder().updateTimestamp();

    if (metadata) {
      if (metadata.groupId) messageMetadata.setGroupId(metadata.groupId);
      if (metadata.model) messageMetadata.setModel(metadata.model);
      if (metadata.usage) messageMetadata.setUsage(metadata.usage);
      if (metadata.latency) messageMetadata.setLatency(metadata.latency);
    }

    return {
      type: MESSAGE_TYPE.DONE,
      data: {} as never,
      metadata: messageMetadata.build(),
    };
  }

  /**
   * 将消息序列化为 SSE 格式
   */
  serializeToSSE<T>(message: SSEMessage<T>): string {
    try {
      return `data: ${JSON.stringify(message)}\n\n`;
    } catch (error) {
      this.logger.error('Failed to serialize message to SSE', {
        error,
        message,
      });
      const errorMessage = this.formatError(
        'Failed to serialize message',
        ErrorCode.SSE_FORMAT_ERROR,
        { originalMessage: message },
      );
      return `data: ${JSON.stringify(errorMessage)}\n\n`;
    }
  }

  /**
   * 从 LangChain 消息块中提取工具调用信息
   */
  extractToolCalls(chunk: AIMessageChunk): ToolCall[] {
    if (!chunk.tool_calls || chunk.tool_calls.length === 0) {
      return [];
    }

    return chunk.tool_calls.map((toolCall) => ({
      id: toolCall.id,
      name: toolCall.name,
      args: toolCall.args,
    }));
  }

  /**
   * 检查消息块是否包含工具调用
   */
  hasToolCalls(chunk: AIMessageChunk): boolean {
    return !!(chunk.tool_calls && chunk.tool_calls.length > 0);
  }

  /**
   * 从消息块中提取文本内容
   */
  extractTextContent(message: BaseMessage): string {
    if (message instanceof AIMessageChunk) {
      return message.content.toString();
    }
    return '';
  }
}
