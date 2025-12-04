import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Inject } from '@nestjs/common';
import { nanoid } from 'nanoid';
import {
  AIMessageChunk,
  BaseMessage,
  ToolCall,
  HumanMessage,
  AIMessage,
} from '@langchain/core/messages';
import { MESSAGE_ROLE, MESSAGE_TYPE } from '@server/chat/chat.interface';
import {
  StreamMessage,
  MessageMetadata,
  StructuredError,
  type MessageChunkData,
} from '@server/chat/dto/sse-message.dto';
import { MessageMetadataBuilder } from '@server/chat/dto/message-metadata.dto';
import { Message } from 'generated/prisma/client';

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
    id: string,
    chunk: AIMessageChunk,
    metadata: Partial<MessageMetadata>,
  ): StreamMessage {
    const messageMetadata = new MessageMetadataBuilder().updateTimestamp();

    if (metadata) {
      if (metadata.usage) messageMetadata.setUsage(metadata.usage);
      if (metadata.latency) messageMetadata.setLatency(metadata.latency);
    }

    return {
      id,
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
  formatMessageStart(metadata: Partial<MessageMetadata>): StreamMessage {
    const messageMetadata = new MessageMetadataBuilder().updateTimestamp();

    if (metadata) {
      if (metadata.usage) messageMetadata.setUsage(metadata.usage);
    }

    return {
      id: nanoid(),
      type: MESSAGE_TYPE.MESSAGE_CHUNK,
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
    id: string,
    finishReason: MessageChunkData['finishReason'],
    usage: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    },
    metadata?: Partial<MessageMetadata>,
  ): StreamMessage {
    const messageMetadata = new MessageMetadataBuilder()
      .setUsage(usage)
      .updateTimestamp();

    if (metadata) {
      if (metadata.latency) messageMetadata.setLatency(metadata.latency);
    }

    return {
      id,
      type: MESSAGE_TYPE.MESSAGE_CHUNK,
      data: {
        content: '',
        role: MESSAGE_ROLE.ASSISTANT,
        finishReason,
      },
      metadata: messageMetadata.build(),
    };
  }

  /**
   * 格式化工具调用开始事件
   */
  formatToolCallStart(id: string, toolCall: ToolCall): StreamMessage {
    const messageMetadata = new MessageMetadataBuilder().updateTimestamp();

    return {
      id,
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
    id: string,
    toolCallId: string,
    argsChunk: string,
    index: number,
    metadata?: Partial<MessageMetadata>,
  ): StreamMessage {
    const messageMetadata = new MessageMetadataBuilder().updateTimestamp();

    return {
      id,
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
    id: string,
    toolCall: ToolCall,
    metadata?: Partial<MessageMetadata>,
  ): StreamMessage {
    const messageMetadata = new MessageMetadataBuilder().updateTimestamp();

    return {
      id,
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
    id: string,
    toolCallId: string,
    toolName: string,
    result: unknown,
    error?: string,
    metadata?: Partial<MessageMetadata>,
  ): StreamMessage {
    const messageMetadata = new MessageMetadataBuilder().updateTimestamp();

    return {
      id,
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
    id: string,
    error: Error | string,
    code: number = 500,
    details?: Record<string, unknown>,
    metadata?: Partial<MessageMetadata>,
  ): StreamMessage {
    const messageMetadata = new MessageMetadataBuilder().updateTimestamp();

    if (metadata) {
      if (metadata.latency) messageMetadata.setLatency(metadata.latency);
    }

    const structuredError: StructuredError = {
      code,
      message: error instanceof Error ? error.message : error,
      details: {
        ...details,
        originalError: error instanceof Error ? error.name : undefined,
      },
      stack: error instanceof Error ? error.stack : undefined,
    };

    return {
      id,
      type: MESSAGE_TYPE.ERROR,
      data: {} as never,
      metadata: messageMetadata.build(),
      error: structuredError,
    };
  }

  /**
   * 格式化流结束消息
   */
  formatDone(id: string, metadata?: Partial<MessageMetadata>): StreamMessage {
    const messageMetadata = new MessageMetadataBuilder().updateTimestamp();

    if (metadata) {
      if (metadata.usage) messageMetadata.setUsage(metadata.usage);
      if (metadata.latency) messageMetadata.setLatency(metadata.latency);
    }

    return {
      id,
      type: MESSAGE_TYPE.DONE,
      data: {} as never,
      metadata: messageMetadata.build(),
    };
  }

  /**
   * 将消息序列化为 SSE 格式
   */
  serializeToSSE(message: StreamMessage): string {
    try {
      return `data: ${JSON.stringify(message)}\n\n`;
    } catch (error) {
      this.logger.error('Failed to serialize message to SSE', {
        error,
        message,
      });
      const errorMessage = this.formatError(
        message.id,
        new Error('Failed to serialize message'),
        500,
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

  /**
   * 将数据库消息转换为 LangChain BaseMessage 格式
   */
  toLangChainMessages(messages: Message[]): BaseMessage[] {
    return messages.map((item) => {
      if (item.role === MESSAGE_ROLE.HUMAN) {
        return new HumanMessage(item.content);
      } else {
        return new AIMessage(item.content);
      }
    });
  }

  /**
   * 将数据库消息转换为 StreamMessage 格式
   */
  toStreamMessages(messages: Message[]): StreamMessage[] {
    return messages.map((item) => ({
      id: item.uid,
      type: MESSAGE_TYPE.MESSAGE_CHUNK,
      data: {
        content: item.content,
        role: item.role as MESSAGE_ROLE,
      },
      metadata: {
        timestamp: item.createdAt.getTime(),
        usage: undefined,
        latency: undefined,
      },
    }));
  }
}
