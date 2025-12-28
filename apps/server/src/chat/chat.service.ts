import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
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
import { from, share, interval, Observable, Subject } from 'rxjs';
import { delay, concatMap, take } from 'rxjs/operators';
import { MESSAGE_TYPE } from './chat.interface';
import { MessageFormatterService } from '@server/message/message-formatter.service';
import { MessageStreamProcessor } from './message-stream-processor';
import { StreamMessage } from './dto/sse-message.dto';
import { ThreadService } from '@server/thread/thread.service';
import { ThreadStatus } from '@server/thread/thread-status.enum';
import { RedisService } from '@server/redis/redis.service';
import { KafkaService } from '@server/kafka/kafka.service';
import { KafkaEventType, KafkaMessagePayload } from '@server/kafka/kafka.constants';
import path from 'node:path';
import fs from 'node:fs';
import { uuid } from '@common/utils';
import { Consumer, KafkaMessage } from 'kafkajs';

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

    // 确保 Thread Topic 已创建（异步执行，不阻塞主流程）
    this.kafkaService.createThreadTopic(thread.uid).catch((error) => {
      this.logger.warn('Failed to create thread topic, will retry on produce', {
        error,
        threadUid: thread.uid,
      });
    });

    if (!isMockMode) {
      this.saveMessageToMockFile(source$, isMockMode);
    }
    this.saveMessageToKafka(source$, thread);
    this.saveMessageToDatabase(source$, thread);
    this.transmitMessageToClient(source$, res);

    source$.subscribe({
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
        res.status(500).send({
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: err instanceof Error ? err.message : String(err),
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
   * 保存消息到 Kafka（每个 Thread 独立 Topic）
   * @param source$
   * @param thread
   */
  private saveMessageToKafka(
    source$: Observable<StreamMessage>,
    thread: Thread,
  ) {
    source$.subscribe({
      next: async (sseMessage) => {
        // 发送到 Kafka Thread 专用 Topic
        try {
          const kafkaPayload: KafkaMessagePayload = {
            eventType: KafkaEventType.MESSAGE_CREATED,
            timestamp: Date.now(),
            data: sseMessage,
            metadata: {
              threadUid: thread.uid,
            },
          };

          // 发送到 Thread 专用 Topic：chat-messages-{threadUid}
          await this.kafkaService.produceToThreadTopic(thread.uid, kafkaPayload);

          this.logger.debug(
            `Message sent to Kafka thread topic for thread ${thread.uid}`,
          );
        } catch (error) {
          this.logger.error('Failed to send message to Kafka', {
            error,
            threadUid: thread.uid,
            message: sseMessage,
          });
        }
      },
    });
  }

  private transmitMessageToClient(
    source$: Observable<StreamMessage>,
    res: Response,
  ) {
    source$.subscribe({
      next: (sseMessage) => {
        res.write(this.messageFormatter.serializeToSSE(sseMessage));
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
    const { threadId: threadUid } = body;

    this.logger.info(
      `Restoring thread ${threadUid} for user ${jwtPayload.uid}`,
    );

    try {
      // 1. 验证 thread 所有权
      const thread = await this.threadService.getThreadDetail(
        jwtPayload.uid,
        threadUid,
      );

      if (!thread) {
        this.logger.warn(
          `Thread ${threadUid} not found or access denied for user ${jwtPayload.email}`,
        );
        throw new ForbiddenException('Thread not found or access denied');
      }

      this.logger.info(
        `Thread ${threadUid} access granted for user ${jwtPayload.uid}`,
      );

      // 2. 从 Kafka 消费消息
      const source$ = this.consumeMessagesFromKafka(threadUid, jwtPayload.uid);

      // 3. 传输消息到客户端
      this.transmitMessageToClient(source$, res);

      // 4. 处理订阅生命周期
      source$.subscribe({
        complete: async () => {
          this.logger.info(`Thread ${threadUid} restore completed`);
          res.end();
        },
        error: async (err) => {
          this.logger.error(`Thread ${threadUid} restore error`, {
            error: err,
          });

          // 发送错误消息到客户端
          const errorMessage = this.messageFormatter.formatError(
            uuid.generateMessageId(),
            err instanceof Error ? err : new Error(String(err)),
            500,
            { threadUid },
          );

          res.write(this.messageFormatter.serializeToSSE(errorMessage));
          res.end();
        },
      });

      this.logger.info(`Thread ${threadUid} restore started`);
    } catch (error) {
      this.logger.error('Failed to restore thread', { error, threadUid });

      // 如果是已知的异常类型，直接抛出
      if (error instanceof ForbiddenException) {
        throw error;
      }

      // 否则包装为内部错误
      throw new BadRequestException('Failed to restore thread');
    }
  }

  /**
   * 从 Kafka 消费指定 thread 的消息
   * 返回 Observable 来流式传输消息
   *
   * 优化说明：
   * - 每个 thread 有独立的 topic，无需过滤
   * - 使用独立消费者组，每次都从起始位置开始消费
   * - 简化的消费逻辑，无需手动 assign 和 seek
   */
  private consumeMessagesFromKafka(
    threadUid: string,
    userUid: string,
  ): Observable<StreamMessage> {
    const messageSubject = new Subject<StreamMessage>();
    const consumerGroupId = `restore-${userUid}-${threadUid}`;
    let consumer: Consumer | undefined;

    this.logger.info(`Restoring thread ${threadUid} from its dedicated topic`);

    const processKafkaMessage = async (payload: KafkaMessagePayload) => {
      try {
        // 所有消息都属于当前 thread（因为每个 thread 有独立 topic），无需过滤
        if (payload.eventType === KafkaEventType.MESSAGE_CREATED) {
          const streamMessage = payload.data as StreamMessage;

          this.logger.debug(
            `Restoring message for thread ${threadUid}: ${streamMessage.type}`,
          );

          // 将消息推送到 Subject
          messageSubject.next(streamMessage);
        }
      } catch (error) {
        this.logger.error('Failed to process Kafka message during restore', {
          error,
          threadUid,
          payload,
        });
      }
    };

    // 启动消费者
    this.kafkaService
      .createConsumerForThread(threadUid, consumerGroupId)
      .then(async (createdConsumer) => {
        consumer = createdConsumer;

        this.logger.debug(
          `Consumer subscribed to thread topic for thread ${threadUid}`,
        );

        // 开始消费消息（从起始位置开始）
        await consumer.run({
          eachMessage: async ({ message }: { message: KafkaMessage }) => {
            try {
              const payload: KafkaMessagePayload = JSON.parse(
                message.value?.toString() || '{}',
              );
              await processKafkaMessage(payload);
            } catch (error) {
              this.logger.error(
                'Failed to parse Kafka message during restore',
                { error, threadUid },
              );
            }
          },
        });
      })
      .catch((error) => {
        this.logger.error('Failed to start Kafka consumer for restore', {
          error,
          threadUid,
          consumerGroupId,
        });
        messageSubject.error(error);
      });

    // 返回 Observable，并添加清理逻辑
    return new Observable<StreamMessage>((observer) => {
      const subscription = messageSubject.subscribe({
        next: (msg) => observer.next(msg),
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });

      // 当取消订阅时，清理消费者
      return () => {
        subscription.unsubscribe();
        messageSubject.complete();

        // 断开消费者连接
        if (consumer !== undefined) {
          consumer
            .disconnect()
            .then(() => {
              this.logger.debug(
                `Consumer disconnected for thread ${threadUid}`,
              );
            })
            .catch((err: Error) => {
              this.logger.error(
                `Failed to disconnect consumer for thread ${threadUid}`,
                { error: err },
              );
            });
        }
      };
    });
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
