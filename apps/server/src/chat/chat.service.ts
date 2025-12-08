import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CreateChatDto } from './dto/create-chat.dto';
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
import path from 'node:path';
import fs from 'node:fs';
import { uuid } from '@common/utils';

const REDIS_KEY_PREFIX = 'streaming:thread:';

const getRedisMessage = (threadUid: string) => {
  return `${REDIS_KEY_PREFIX}${threadUid}:messages`;
};
const getRedisChannel = (threadUid: string) => {
  return `${REDIS_KEY_PREFIX}${threadUid}:channel`;
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
    // Redis 缓存键
    const listKey = getRedisMessage(thread.uid);
    const channel = getRedisChannel(thread.uid);

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
    this.transmitMessageToClient(source$, res, listKey, channel);

    source$.subscribe({
      complete: async () => {
        await this.threadService.updateStatus(
          thread.uid,
          ThreadStatus.COMPLETED,
        );
      },
    });
  }

  private async transmitMessageToClient(
    source$: Observable<StreamMessage>,
    res: Response,
    listKey: string,
    channel: string,
  ) {
    source$.subscribe({
      next: async (sseMessage) => {
        res.write(this.messageFormatter.serializeToSSE(sseMessage));
      },

      complete: async () => {
        // 对话完成，标记状态
        if (this.redisService.isAvailable) {
          try {
            await this.threadService.updateStatus(
              res.req?.params?.threadId || '',
              ThreadStatus.COMPLETED,
            );

            // 发布完成事件到 control channel
            await this.redisService.publish(`${channel}:control`, 'complete');

            this.logger.info('Thread status set to COMPLETED', {
              threadId: res.req?.params?.threadId,
            });
          } catch (error) {
            this.logger.error('Failed to mark thread as completed', {
              error,
              threadId: res.req?.params?.threadId,
            });
          }
        }

        res.end();
      },

      error: async (err) => {
        this.logger.error('Stream error', {
          error: err,
          threadId: res.req?.params?.threadId,
        });

        // 错误处理：是否需要标记为 completed？
        // 这里可以决定是否将错误状态标记为 completed
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
   * 保存消息到 Redis
   * @param source$
   * @param thread
   */
  private saveMessageToRedis(
    source$: Observable<StreamMessage>,
    thread: Thread,
  ) {
    const listKey = getRedisMessage(thread.uid);
    const channel = getRedisChannel(thread.uid);

    source$.subscribe({
      next: async (sseMessage) => {
        if (this.redisService.isAvailable) {
          try {
            // 排除控制消息（PING, ERROR, DONE）
            const isControlMessage =
              sseMessage.type === MESSAGE_TYPE.PING ||
              sseMessage.type === MESSAGE_TYPE.ERROR ||
              sseMessage.type === MESSAGE_TYPE.DONE;

            if (!isControlMessage) {
              const messageStr = JSON.stringify(sseMessage);

              // 并行执行 Redis 操作
              await Promise.all([
                this.redisService.pushToList(listKey, messageStr),
                this.redisService.publish(channel, messageStr),
              ]);

              // 设置 TTL
              await this.redisService.expire(listKey, 3600);
            }
          } catch (error) {
            this.logger.error('Failed to cache message to Redis', {
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
  async restoreThread(threadId: string): Promise<Observable<StreamMessage>> {
    const listKey = getRedisMessage(threadId);
    const channel = getRedisChannel(threadId);
    const pubSubClient = this.redisService.getPubSubClient();
    let isCompleted = false;
    let historyProcessed = false;
    let pendingMessages: StreamMessage[] = [];
    let lastSentTimestamp = 0;

    return new Observable<StreamMessage>((subscriber) => {
      const messageHandler = (recvChannel: string, message: string) => {
        if (isCompleted || recvChannel !== channel) return;

        try {
          const msg = JSON.parse(message) as StreamMessage;

          if (historyProcessed) {
            // 历史消息已处理完，直接发送新消息
            if (msg.metadata.timestamp >= lastSentTimestamp) {
              subscriber.next(msg);
              lastSentTimestamp = msg.metadata.timestamp;
            } else {
              // 如果新消息时间戳早于最后发送的消息，需要重新排序
              pendingMessages.push(msg);
              processPendingMessages();
            }
          } else {
            // 历史消息未处理完，先缓存
            pendingMessages.push(msg);
          }
        } catch (error) {
          this.logger.error(
            `Failed to parse Redis message from channel ${recvChannel}`,
            error,
          );
          // 不中断流，只记录错误
        }
      };

      const processPendingMessages = () => {
        if (pendingMessages.length === 0) return;

        // 排序并发送待处理消息
        pendingMessages.sort(
          (a, b) => a.metadata.timestamp - b.metadata.timestamp,
        );

        for (const msg of pendingMessages) {
          if (msg.metadata.timestamp > lastSentTimestamp) {
            subscriber.next(msg);
            lastSentTimestamp = msg.metadata.timestamp;
          }
        }

        // 清空已发送的消息
        pendingMessages = pendingMessages.filter(
          (msg) => msg.metadata.timestamp > lastSentTimestamp,
        );
      };

      const cleanup = async () => {
        isCompleted = true;
        try {
          pubSubClient.removeListener('message', messageHandler);
          await this.redisService.unsubscribeFromChannels(channel);
          this.logger.debug(
            `Cleaned up restore thread subscription for ${threadId}`,
          );
        } catch (error) {
          this.logger.error('Error during cleanup of restore thread', error);
        }
      };

      // 设置清理函数
      subscriber.add(() => {
        cleanup();
      });

      // 启动订阅流程
      (async () => {
        try {
          // 检查 Redis 是否可用
          if (!this.redisService.isAvailable) {
            throw new Error('Redis service is not available');
          }

          // 1. 先设置消息监听器
          pubSubClient.on('message', messageHandler);

          // 2. 订阅频道
          await this.redisService.subscribeToChannels(channel);
          this.logger.debug(`Subscribed to Redis channel: ${channel}`);

          // 3. 读取历史消息
          const historyMessages = await this.redisService.getListRange(listKey);
          this.logger.debug(
            `Found ${historyMessages.length} history messages for thread ${threadId}`,
          );

          if (historyMessages.length === 0) {
            // 如果没有历史消息，发送一个 PING 消息表示连接已建立
            const pingMessage: StreamMessage = {
              type: MESSAGE_TYPE.PING,
              data: null,
              id: uuid.generateUid(),
              metadata: {
                timestamp: Date.now(),
              },
            };
            subscriber.next(pingMessage);
            this.logger.debug(`Sent ping message for empty thread ${threadId}`);
            return;
          }

          // 4. 解析历史消息
          const parsedMessages: StreamMessage[] = [];
          for (const messageStr of historyMessages) {
            try {
              const msg = JSON.parse(messageStr) as StreamMessage;
              parsedMessages.push(msg);
            } catch (error) {
              this.logger.error('Failed to parse history message', error);
              // 跳过无法解析的消息，继续处理其他消息
            }
          }

          // 5. 合并历史消息和待处理的新消息
          const allMessages = [...parsedMessages, ...pendingMessages];

          if (allMessages.length === 0) {
            // 如果没有任何消息，发送一个 PING 消息表示连接已建立
            const pingMessage: StreamMessage = {
              type: MESSAGE_TYPE.PING,
              data: null,
              id: uuid.generateUid(),
              metadata: {
                timestamp: Date.now(),
              },
            };
            subscriber.next(pingMessage);
            this.logger.debug(`Sent ping message for empty thread ${threadId}`);
            historyProcessed = true;
            pendingMessages = [];
            return;
          }

          // 6. 按时间戳排序所有消息
          allMessages.sort(
            (a, b) => a.metadata.timestamp - b.metadata.timestamp,
          );

          // 7. 发送所有消息
          for (const message of allMessages) {
            if (isCompleted) break;
            subscriber.next(message);
            lastSentTimestamp = message.metadata.timestamp;
          }

          // 8. 标记历史消息处理完成，清空待处理队列
          historyProcessed = true;
          pendingMessages = [];

          this.logger.debug(
            `Sent ${allMessages.length} total messages for thread ${threadId}`,
          );
        } catch (error) {
          this.logger.error(`Failed to restore thread ${threadId}`, error);

          // 发送错误消息而不是中断流
          const errorMessage: StreamMessage = {
            type: MESSAGE_TYPE.ERROR,
            data: null,
            id: uuid.generateMessageId(),
            metadata: {
              timestamp: Date.now(),
            },
            error: {
              code: 500,
              message:
                error instanceof Error
                  ? error.message
                  : 'Unknown error occurred',
              details: { threadId },
            },
          };

          subscriber.next(errorMessage);
          await cleanup();
        }
      })();
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
