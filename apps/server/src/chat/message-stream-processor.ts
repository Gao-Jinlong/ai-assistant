import { Logger } from 'winston';
import {
  AIMessageChunk,
  ToolCall,
  type BaseMessage,
} from '@langchain/core/messages';
import { MessageFormatterService } from './message-formatter.service';
import { StreamMessage, MessageMetadata } from './dto/sse-message.dto';
import { ErrorCode } from '@server/common/errors/error-codes';
import type { IterableReadableStream } from '@langchain/core/utils/stream';
import { uuid as uuidUtils } from '@common/utils';

/**
 * 消息流处理器
 * 负责从 agent stream 中提取不同类型的消息并生成统一格式的事件
 */
export class MessageStreamProcessor {
  private readonly startTime: number;
  private currentToolCall: ToolCall | null = null;
  private toolCallArgsBuffer: string = '';
  private toolCallIndex: number = 0;
  private messageChunkIndex: number = 0;
  private totalTokens: { promptTokens?: number; completionTokens?: number } =
    {};

  constructor(
    private readonly id: string,
    private readonly logger: Logger,
    private readonly messageFormatter: MessageFormatterService,
  ) {
    this.id = uuidUtils.generateMessageId();
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
  ): AsyncGenerator<StreamMessage, void, unknown> {
    try {
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
        // yield this.messageFormatter.formatToolCallEnd(this.currentToolCall, {
        //   groupId: this.groupId,
        // });
        // this.currentToolCall = null;
      }

      // 发送消息结束事件
      const latency = Date.now() - this.startTime;
      yield this.messageFormatter.formatMessageEnd(
        this.id,
        'stop', // 这里可以根据实际情况判断结束原因
        this.totalTokens,
        {
          latency,
        },
      );

      // 发送流结束事件
      yield this.messageFormatter.formatDone(this.id, {
        usage: this.totalTokens,
        latency,
      });
    } catch (error) {
      this.logger.error('Error processing message stream', { error });
      yield this.messageFormatter.formatError(
        this.id,
        error as Error,
        ErrorCode.STREAM_ERROR,
      );
    }
  }

  /**
   * 处理 AI 消息块
   */
  private async *processMessagesChunk(
    chunk: [BaseMessage, Partial<MessageMetadata>],
  ): AsyncGenerator<StreamMessage, void, unknown> {
    const [message, metadata] = chunk;
    const finalMetadata: Partial<MessageMetadata> = {
      ...metadata,
    };

    if (message instanceof AIMessageChunk) {
      // TODO 处理工具调用
      if (this.messageFormatter.hasToolCalls(message)) {
        // yield* this.processToolCalls(message, finalMetadata);
        return;
      }
      const textContent = this.messageFormatter.extractTextContent(message);
      // 处理文本内容
      if (textContent) {
        yield this.messageFormatter.formatMessageChunk(
          this.id,
          message,
          finalMetadata,
        );
      }
    }
  }

  // /**
  //  * 处理工具调用
  //  */
  // private async *processToolCalls(
  //   chunk: AIMessageChunk,
  //   baseMetadata: Partial<MessageMetadata>,
  // ): AsyncGenerator<SSEMessage, void, unknown> {
  //   const toolCalls = this.messageFormatter.extractToolCalls(chunk);

  //   for (const toolCall of toolCalls) {
  //     // 如果这是新的工具调用，结束之前的工具调用
  //     if (this.currentToolCall && this.currentToolCall.id !== toolCall.id) {
  //       yield this.messageFormatter.formatToolCallEnd(
  //         this.currentToolCall,
  //         baseMetadata,
  //       );
  //       this.toolCallArgsBuffer = '';
  //       this.toolCallIndex = 0;
  //     }

  //     // 开始新的工具调用
  //     if (!this.currentToolCall || this.currentToolCall.id !== toolCall.id) {
  //       this.currentToolCall = toolCall;
  //       yield this.messageFormatter.formatToolCallStart(toolCall, baseMetadata);
  //     }

  //     // 处理工具调用参数
  //     yield* this.processToolCallArgs(toolCall, baseMetadata);
  //   }
  // }

  // /**
  //  * 处理工具调用参数
  //  */
  // private async *processToolCallArgs(
  //   toolCall: ToolCall,
  //   baseMetadata: Partial<MessageMetadata>,
  // ): AsyncGenerator<SSEMessage, void, unknown> {
  //   try {
  //     const argsString = JSON.stringify(toolCall.args);

  //     // 如果参数很大，可以分块发送
  //     const chunkSize = 100; // 可以根据需要调整
  //     const toolCallId = toolCall.id || nanoid();
  //     if (argsString.length > chunkSize) {
  //       for (let i = 0; i < argsString.length; i += chunkSize) {
  //         const chunk = argsString.slice(i, i + chunkSize);
  //         yield this.messageFormatter.formatToolCallChunk(
  //           toolCallId,
  //           chunk,
  //           this.toolCallIndex++,
  //           baseMetadata,
  //         );
  //       }
  //     } else {
  //       yield this.messageFormatter.formatToolCallChunk(
  //         toolCallId,
  //         argsString,
  //         this.toolCallIndex++,
  //         baseMetadata,
  //       );
  //     }
  //   } catch (error) {
  //     this.logger.error('Error processing tool call args', { error, toolCall });
  //     yield this.messageFormatter.formatError(
  //       error as Error,
  //       ErrorCode.TOOL_VALIDATION_ERROR,
  //       { toolCallId: toolCall.id, toolName: toolCall.name },
  //       baseMetadata,
  //     );
  //   }
  // }
}
