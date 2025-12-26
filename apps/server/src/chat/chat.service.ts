import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CreateChatDto, RestoreChatDto } from './dto/create-chat.dto';
import { MessageService } from '@server/message/message.service';
import { JwtPayload } from '@server/auth/auth.service';
import { AgentService } from '@server/agent/agent.service';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { ConfigService } from '@nestjs/config';
import { Thread } from 'generated/prisma/client';
import { from, share, interval, Observable } from 'rxjs';
import { delay, concatMap, take } from 'rxjs/operators';
import { MESSAGE_TYPE } from './chat.interface';
import { MessageFormatterService } from '@server/message/message-formatter.service';
import { MessageStreamProcessor } from './message-stream-processor';
import { StreamMessage } from './dto/sse-message.dto';
import { ThreadService } from '@server/thread/thread.service';
import { ThreadStatus } from '@server/thread/thread-status.enum';
import { RedisService } from '@server/redis/redis.service';
import { KafkaService } from '@server/kafka/kafka.service';
import { KafkaTopic, KafkaEventType, KafkaMessagePayload } from '@server/kafka/kafka.constants';
import path from 'node:path';
import fs from 'node:fs';
import { uuid } from '@common/utils';

const REDIS_KEY_PREFIX = 'streaming:thread:';

const getRedisMessage = (threadUid: string) => {
  return `${REDIS_KEY_PREFIX}${threadUid}:messages`;
};

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly messageService: MessageService,
    private readonly agentService: AgentService,
    private readonly configService: ConfigService,
    private readonly messageFormatter: MessageFormatterService,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
    private readonly threadService: ThreadService,
  ) {}

  async chat(res: Response, jwtPayload: JwtPayload, body: CreateChatDto) {
    const { threadId: threadUid, content } = body;
    const messageId = uuid.generateMessageId();
    const messageStreamProcessor = new MessageStreamProcessor(
      messageId,
      this.logger,
      this.messageFormatter,
    );

    const userMessage = new HumanMessage(content);

    const thread = await this.prisma.db.thread.findUnique({
      where: { uid: threadUid },
    });
    if (!thread) {
      throw new BadRequestException('Thread not found');
    }

    const messages = await this.messageService.getHistoryByThread(thread.uid);
    const memory = this.messageFormatter.toLangChainMessages(messages);
    await this.messageService.appendMessage(thread, [userMessage]);

    try {
      // 检查是否启用 mock 模式
      const isMockMode = this.configService.get('mock.enable', false);

      let source$: Observable<StreamMessage>;
      if (isMockMode) {
        this.logger.info('Using mock mode for chat');
        source$ = this.readMessagesFromMockFile(messageId);
      } else {
        const stream = await this.agentService.run({
          thread,
          memory,
          message: userMessage,
        });
        const processedStream = messageStreamProcessor.processStream(stream);
        source$ = from(processedStream).pipe(share());
      }

      // 处理统一格式的消息流
      await this.handleProcessedStream({ source$, res, thread, isMockMode });
    } catch (error) {
      this.logger.error('Error in chat', { error, threadUid });

      const errorMessage = this.messageFormatter.formatError(
        messageId,
        error instanceof Error ? error : new Error(error as string),
        500,
        { threadUid },
      );

      res.write(this.messageFormatter.serializeToSSE(errorMessage));
      res.end();
    }
  }
  /**
   * 处理统一格式的消息流
   */
  private async handleProcessedStream({
    source$,
    res,
    thread,
    isMockMode,
  }: {
    source$: Observable<StreamMessage>;
    res: Response;
    thread: Thread;
    isMockMode: boolean;
  }) {
    // 标记对话状态为进行中
    if (this.redisService.isAvailable) {
      try {
        await this.threadService.updateStatus(
          thread.uid,
          ThreadStatus.IN_PROGRESS,
        );
        this.logger.info('Thread status set to IN_PROGRESS', {
          threadId: thread.uid,
        });
      } catch (error) {
        this.logger.error('Failed to set thread status', {
          error,
          threadId: thread.uid,
        });
      }
    }

    if (!isMockMode) {
      this.saveMessageToMockFile(source$, isMockMode);
    }
    this.saveMessageToRedis(source$, thread);
    this.saveMessageToDatabase(source$, thread);

    // 传输消息到客户端并处理完成事件
    source$.subscribe({
      next: async (sseMessage) => {
        res.write(this.messageFormatter.serializeToSSE(sseMessage));
      },
      complete: async () => {
        await this.threadService.updateStatus(
          thread.uid,
          ThreadStatus.COMPLETED,
        );
        this.logger.info('Thread status set to COMPLETED', {
          threadId: thread.uid,
        });
        res.end();
      },
      error: async (err) => {
        await this.threadService.updateStatus(thread.uid, ThreadStatus.ERROR);
        this.logger.error('Stream error', {
          error: err,
          threadId: thread.uid,
        });
        res.end();
      },
    });
  }

  private saveMessageToDatabase(
    source$: Observable<StreamMessage>,
    thread: Thread,
  ) {
    let mergedMessage = '';
    source$.subscribe({
      next: (sseMessage) => {
        if (sseMessage.type === MESSAGE_TYPE.MESSAGE_CHUNK) {
          mergedMessage = mergedMessage.concat(sseMessage.data.content ?? '');
        }
      },
      complete: async () => {
        await this.messageService.appendMessage(thread, [
          new AIMessage(mergedMessage),
        ]);
      },
    });
  }
  /**
   * 保存消息到 Redis 和发送到 Kafka
   * @param source$
   * @param thread
   */
  private saveMessageToRedis(
    source$: Observable<StreamMessage>,
    thread: Thread,
  ) {
    const listKey = getRedisMessage(thread.uid);

    source$.subscribe({
      next: async (sseMessage) => {
        // 排除控制消息（PING, ERROR, DONE）
        const isControlMessage =
          sseMessage.type === MESSAGE_TYPE.PING ||
          sseMessage.type === MESSAGE_TYPE.ERROR ||
          sseMessage.type === MESSAGE_TYPE.DONE;

        if (!isControlMessage) {
          const messageStr = JSON.stringify(sseMessage);

          // 保存到 Redis List（用于缓存）
          if (this.redisService.isAvailable) {
            try {
              await this.redisService.pushToList(listKey, messageStr);
              // 设置 TTL
              await this.redisService.expire(listKey, 3600);
            } catch (error) {
              this.logger.error('Failed to cache message to Redis', {
                error,
                threadUid: thread.uid,
                message: sseMessage,
              });
            }
          }

          // 发送到 Kafka（替代 Redis pub/sub）
          try {
            const kafkaPayload: KafkaMessagePayload = {
              eventType: KafkaEventType.MESSAGE_CREATED,
              timestamp: Date.now(),
              data: sseMessage,
              metadata: {
                threadId: thread.uid,
              },
            };

            await this.kafkaService.produceToTopic(
              KafkaTopic.CHAT_MESSAGES,
              kafkaPayload,
              thread.uid, // 使用 thread UID 作为 key，保证同一 thread 的消息顺序
            );
          } catch (error) {
            this.logger.error('Failed to send message to Kafka', {
              error,
              threadUid: thread.uid,
              message: sseMessage,
            });
          }
        }
      },
    });
  }

  private saveMessageToMockFile(
    source$: Observable<StreamMessage>,
    isMockMode = false,
  ) {
    // 如果是 mock 模式，不保存消息到文件（避免重复保存）
    if (isMockMode) {
      return;
    }

    const mockFilePath = this.configService.get('mock.path');
    if (!fs.existsSync(mockFilePath)) {
      fs.mkdirSync(mockFilePath, { recursive: true });
    }
    const mockFile = path.join(mockFilePath, 'chat.txt');

    // 清空文件内容
    fs.writeFileSync(mockFile, '');

    source$.subscribe({
      next: (sseMessage) => {
        fs.appendFileSync(mockFile, JSON.stringify(sseMessage) + '\n');
      },
      error: (error) => {
        this.logger.error('Error saving message to mock file', { error });
      },
    });
  }

  /**
   * Restore 对话（SSE 接口）
   */
  async restoreThread(
    res: Response,
    jwtPayload: JwtPayload,
    body: RestoreChatDto,
  ) {
    // TODO 实现恢复对话逻辑
  }

  private handleRestoreStream({
    source$,
    res,
  }: {
    source$: Observable<StreamMessage>;
    res: Response;
    thread: Thread;
    isMockMode: boolean;
  }) {
    // TODO 实现恢复对话逻辑
  }
  private readMessagesFromMockFile(id: string): Observable<StreamMessage> {
    const mockFilePath = this.configService.get('mock.path');
    const mockFile = path.join(mockFilePath, 'chat.txt');

    if (!fs.existsSync(mockFile)) {
      this.logger.warn('Mock file does not exist', { mockFile });
      return from([]);
    }

    try {
      const fileContent = fs.readFileSync(mockFile, 'utf-8');
      const lines = fileContent
        .trim()
        .split('\n')
        .filter((line) => line.trim());

      if (lines.length === 0) {
        this.logger.warn('Mock file is empty', { mockFile });
        return from([]);
      }

      const messages: StreamMessage[] = lines
        .map((line) => {
          try {
            const message = JSON.parse(line) as StreamMessage;
            message.id = id;
            return message;
          } catch (error) {
            this.logger.error('Failed to parse mock message', { line, error });
            return null;
          }
        })
        .filter((msg): msg is StreamMessage => msg !== null);

      // 使用 interval 来模拟流式发送，每个消息间隔 100ms
      // 使用 take 操作符确保流在发送完所有消息后完成
      return interval(100).pipe(
        concatMap((index) => {
          if (index < messages.length) {
            return from([messages[index]]).pipe(delay(0));
          }
          // 当所有消息发送完毕后，返回 EMPTY 来完成流
          return from([]).pipe(delay(0));
        }),
        // 限制发送的消息数量，确保流能正确完成
        take(messages.length),
      );
    } catch (error) {
      this.logger.error('Error reading mock file', { error, mockFile });
      return from([]);
    }
  }
}
