import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Inject } from '@nestjs/common';
import { nanoid } from 'nanoid';
import {
  AIMessageChunk,
  ToolCall,
  type BaseMessage,
} from '@langchain/core/messages';
import { MessageFormatterService } from './message-formatter.service';
import { SSEMessage, MessageMetadata } from './dto/sse-message.dto';
import { ErrorCode } from '@server/common/errors/error-codes';
import type { IterableReadableStream } from '@langchain/core/utils/stream';

/**
 * 消息流处理器
 * 负责从 agent stream 中提取不同类型的消息并生成统一格式的事件
 */
export class MessageStreamProcessor {
  private readonly groupId: string;
  private readonly startTime: number;
  private currentToolCall: ToolCall | null = null;
  private toolCallArgsBuffer: string = '';
  private toolCallIndex: number = 0;
  private messageChunkIndex: number = 0;
  private totalTokens: { promptTokens?: number; completionTokens?: number } =
    {};

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly messageFormatter: MessageFormatterService,
  ) {
    this.groupId = nanoid();
    this.startTime = Date.now();
  }

  /**
   * 处理 LangChain 消息流并生成统一格式的 SSE 消息
   */
  async *processStream(
    stream: IterableReadableStream<
      | ['messages', [BaseMessage, Partial<MessageMetadata>]]
      | ['custom', Partial<MessageMetadata>]
    >,
  ): AsyncGenerator<SSEMessage, void, unknown> {
    try {
      // 发送消息开始事件
      yield this.messageFormatter.formatMessageStart({
        groupId: this.groupId,
        timestamp: this.startTime,
      });

      for await (const chunk of stream) {
        const [type, payload] = chunk;
        switch (type) {
          case 'messages':
            yield* this.processMessagesChunk(payload);
            break;
          case 'custom':
            // yield* this.processCustomChunk(payload);
            break;
          default: {
            const _exhaustiveCheck: never = type;
            throw new Error(`Unexpected type: ${_exhaustiveCheck}`);
          }
        }
      }

      // 如果有未完成的工具调用，发送结束事件
      if (this.currentToolCall) {
        yield this.messageFormatter.formatToolCallEnd(this.currentToolCall, {
          groupId: this.groupId,
        });
        this.currentToolCall = null;
      }

      // 发送消息结束事件
      const latency = Date.now() - this.startTime;
      yield this.messageFormatter.formatMessageEnd(
        'stop', // 这里可以根据实际情况判断结束原因
        this.totalTokens,
        {
          groupId: this.groupId,
          latency,
        },
      );

      // 发送流结束事件
      yield this.messageFormatter.formatDone({
        groupId: this.groupId,
        usage: this.totalTokens,
        latency,
      });
    } catch (error) {
      this.logger.error('Error processing message stream', { error });
      yield this.messageFormatter.formatError(
        error as Error,
        ErrorCode.STREAM_ERROR,
        { groupId: this.groupId },
        {
          groupId: this.groupId,
        },
      );
    }
  }

  /**
   * 处理 AI 消息块
   */
  private async *processMessagesChunk(
    chunk: [BaseMessage, Partial<MessageMetadata>],
  ): AsyncGenerator<SSEMessage, void, unknown> {
    const [message, metadata] = chunk;
    const baseMetadata: Partial<MessageMetadata> = {
      ...metadata,
      groupId: this.groupId,
    };

    if (message instanceof AIMessageChunk) {
      // 检查是否有工具调用
      if (this.messageFormatter.hasToolCalls(message)) {
        yield* this.processToolCalls(message, baseMetadata);
      }
      const textContent = this.messageFormatter.extractTextContent(message);

      // 处理文本内容
      if (textContent) {
        yield this.messageFormatter.formatMessageChunk(message, {
          ...baseMetadata,
          messageChunkIndex: this.messageChunkIndex++,
        });
      }
    }
  }

  /**
   * 处理工具调用
   */
  private async *processToolCalls(
    chunk: AIMessageChunk,
    baseMetadata: Partial<MessageMetadata>,
  ): AsyncGenerator<SSEMessage, void, unknown> {
    const toolCalls = this.messageFormatter.extractToolCalls(chunk);

    for (const toolCall of toolCalls) {
      // 如果这是新的工具调用，结束之前的工具调用
      if (this.currentToolCall && this.currentToolCall.id !== toolCall.id) {
        yield this.messageFormatter.formatToolCallEnd(
          this.currentToolCall,
          baseMetadata,
        );
        this.toolCallArgsBuffer = '';
        this.toolCallIndex = 0;
      }

      // 开始新的工具调用
      if (!this.currentToolCall || this.currentToolCall.id !== toolCall.id) {
        this.currentToolCall = toolCall;
        yield this.messageFormatter.formatToolCallStart(toolCall, baseMetadata);
      }

      // 处理工具调用参数
      yield* this.processToolCallArgs(toolCall, baseMetadata);
    }
  }

  /**
   * 处理工具调用参数
   */
  private async *processToolCallArgs(
    toolCall: ToolCall,
    baseMetadata: Partial<MessageMetadata>,
  ): AsyncGenerator<SSEMessage, void, unknown> {
    try {
      const argsString = JSON.stringify(toolCall.args);

      // 如果参数很大，可以分块发送
      const chunkSize = 100; // 可以根据需要调整
      const toolCallId = toolCall.id || nanoid();
      if (argsString.length > chunkSize) {
        for (let i = 0; i < argsString.length; i += chunkSize) {
          const chunk = argsString.slice(i, i + chunkSize);
          yield this.messageFormatter.formatToolCallChunk(
            toolCallId,
            chunk,
            this.toolCallIndex++,
            baseMetadata,
          );
        }
      } else {
        yield this.messageFormatter.formatToolCallChunk(
          toolCallId,
          argsString,
          this.toolCallIndex++,
          baseMetadata,
        );
      }
    } catch (error) {
      this.logger.error('Error processing tool call args', { error, toolCall });
      yield this.messageFormatter.formatError(
        error as Error,
        ErrorCode.TOOL_VALIDATION_ERROR,
        { toolCallId: toolCall.id, toolName: toolCall.name },
        baseMetadata,
      );
    }
  }

  /**
   * 模拟工具执行结果（用于测试）
   */
  async *simulateToolExecution(
    toolCall: ToolCall,
    baseMetadata: Partial<MessageMetadata>,
  ): AsyncGenerator<SSEMessage, void, unknown> {
    // 这里可以添加实际的工具执行逻辑
    // 目前只是模拟返回结果
    const mockResult = {
      success: true,
      data: `Tool ${toolCall.name} executed with args: ${JSON.stringify(toolCall.args)}`,
      timestamp: Date.now(),
    };

    yield this.messageFormatter.formatToolResult(
      toolCall.id || nanoid(),
      toolCall.name,
      mockResult,
      undefined,
      baseMetadata,
    );
  }

  /**
   * 更新 Token 使用统计
   */
  updateTokenUsage(usage: {
    promptTokens?: number;
    completionTokens?: number;
  }) {
    this.totalTokens.promptTokens =
      (this.totalTokens.promptTokens || 0) + (usage.promptTokens || 0);
    this.totalTokens.completionTokens =
      (this.totalTokens.completionTokens || 0) + (usage.completionTokens || 0);
    // 计算总token数
    const totalTokens =
      (this.totalTokens.promptTokens || 0) +
      (this.totalTokens.completionTokens || 0);
    (this.totalTokens as any).totalTokens = totalTokens;
  }

  /**
   * 获取当前统计信息
   */
  getStats() {
    return {
      groupId: this.groupId,
      startTime: this.startTime,
      currentLatency: Date.now() - this.startTime,
      totalTokens: this.totalTokens,
      messageChunkCount: this.messageChunkIndex,
      toolCallCount: this.toolCallIndex,
    };
  }

  /**
   * 重置处理器状态
   */
  reset() {
    this.currentToolCall = null;
    this.toolCallArgsBuffer = '';
    this.toolCallIndex = 0;
    this.messageChunkIndex = 0;
    this.totalTokens = {};
  }
}
