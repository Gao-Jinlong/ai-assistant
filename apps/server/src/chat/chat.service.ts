import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CreateChatDto } from './dto/create-chat.dto';
import { MessageService } from '@server/message/message.service';
import { JwtPayload } from '@server/auth/auth.service';
import { AgentService } from '@server/agent/agent.service';
import {
  AIMessageChunk,
  HumanMessage,
  type BaseMessage,
  type BaseMessageChunk,
} from '@langchain/core/messages';
import { ConfigService } from '@nestjs/config';
import path from 'node:path';
import fs from 'node:fs';
import readline from 'node:readline';
import { streamUtils } from '@server/utils';
import { Thread } from '@prisma/client';
// import { from, share, type Observable } from 'rxjs'; // 暂时未使用
import { MESSAGE_TYPE } from './chat.interface';
import { MessageFormatterService } from './message-formatter.service';
import { MessageStreamProcessor } from './message-stream-processor';
import { SSEMessage } from './dto/sse-message.dto';
import { ErrorCode } from '@server/common/errors/error-codes';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly messageService: MessageService,
    private readonly agentService: AgentService,
    private readonly configService: ConfigService,
    private readonly messageFormatter: MessageFormatterService,
    private readonly messageStreamProcessor: MessageStreamProcessor,
  ) {}

  async chat(res: Response, jwtPayload: JwtPayload, body: CreateChatDto) {
    const { threadUid, message } = body;

    const userMessage = new HumanMessage(message);

    const isDev = this.configService.get('isDev');
    const mockEnable = this.configService.get('mock.enable');

    const thread = await this.prisma.db.thread.findUnique({
      where: { uid: threadUid },
    });
    if (!thread) {
      throw new BadRequestException('Thread not found');
    }

    const memory = await this.messageService.getHistoryByThread(thread.uid);

    try {
      let stream: AsyncIterable<BaseMessageChunk>;

      // 开发环境下优先走本地 mock 文件，减少 API 成本
      if (isDev && !mockEnable) {
        stream = this.streamMockSSE();
      } else {
        const agentStream = await this.agentService.run({
          thread,
          memory,
          message: userMessage,
        });
        stream = await streamUtils.streamMessageOutputToGenerator(agentStream);
      }

      // 使用新的消息流处理器
      const model = this.configService.get('model.name') || 'gpt-4';
      const processedStream = this.messageStreamProcessor.processStream(
        stream,
        model,
      );

      // 处理统一格式的消息流
      await this.handleProcessedStream(processedStream, res, thread);
    } catch (error) {
      this.logger.error('Error in chat', { error, threadUid });

      const errorMessage = this.messageFormatter.formatError(
        error as Error,
        ErrorCode.INTERNAL_SERVER_ERROR,
        { threadUid },
      );

      res.write(this.messageFormatter.serializeToSSE(errorMessage));
      res.end();
    }
  }
  /**
   * 处理统一格式的消息流
   */
  private async handleProcessedStream(
    processedStream: AsyncGenerator<SSEMessage, void, unknown>,
    res: Response,
    thread: Thread,
  ) {
    const messageChunks: AIMessageChunk[] = [];
    let mergedMessage = new AIMessageChunk('');

    try {
      for await (const sseMessage of processedStream) {
        // 发送 SSE 消息到客户端
        res.write(this.messageFormatter.serializeToSSE(sseMessage));

        // 收集消息块用于保存
        if (sseMessage.type === MESSAGE_TYPE.MESSAGE_CHUNK) {
          const messageData = sseMessage.data as { content: string };
          const chunk = new AIMessageChunk(messageData.content);
          messageChunks.push(chunk);
          mergedMessage = mergedMessage.concat(chunk);
        }

        // 处理工具调用结果（如果有的话）
        if (sseMessage.type === MESSAGE_TYPE.TOOL_RESULT) {
          const toolResultData = sseMessage.data as {
            toolCallId: string;
            toolName: string;
          };
          this.logger.info('Tool execution completed', {
            toolCallId: toolResultData.toolCallId,
            toolName: toolResultData.toolName,
          });
        }
      }

      // 保存消息到数据库
      if (messageChunks.length > 0) {
        await this.messageService.appendMessage(thread, [mergedMessage]);
        this.logger.info('Message saved successfully', {
          threadUid: thread.uid,
          chunkCount: messageChunks.length,
        });
      }
    } catch (error) {
      this.logger.error('Error handling processed stream', {
        error,
        threadUid: thread.uid,
      });

      const errorMessage = this.messageFormatter.formatError(
        error as Error,
        ErrorCode.STREAM_ERROR,
        { threadUid: thread.uid },
      );

      res.write(this.messageFormatter.serializeToSSE(errorMessage));
    } finally {
      res.end();
    }
  }

  private async *streamMockSSE(): AsyncIterable<BaseMessageChunk> {
    try {
      const mockPath = this.configService.get('mock.path') ?? './mock';
      const filePath = path.join(mockPath, 'chat.txt');
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`SSE mock file not found at ${filePath}`);
        return;
      }

      const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
      const rl = readline.createInterface({
        input: readStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        const messageChunk = streamUtils.parseSSEMessage(
          line as `data: ${string}`,
        ) as { data: BaseMessage };
        if (messageChunk) {
          yield new AIMessageChunk(messageChunk.data.content.toString());
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (error) {
      this.logger.error('Failed to stream SSE from mock file', { error });
    }
  }
  /**
   * 保存消息到 Mock 文件（用于开发环境）
   */
  private async saveMessageToMockFile(sseMessage: SSEMessage) {
    try {
      const mockPath = this.configService.get('mock.path') ?? './mock';
      const filePath = path.join(mockPath, 'chat.txt');

      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
      }

      const sseData = this.messageFormatter.serializeToSSE(sseMessage);
      fs.appendFileSync(filePath, sseData);
    } catch (error) {
      this.logger.error('Failed to save message to mock file', { error });
    }
  }
}
