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
import { Thread } from '@prisma/client';
import { from, share, interval, Observable } from 'rxjs';
import { delay, concatMap, take } from 'rxjs/operators';
import { MESSAGE_TYPE } from './chat.interface';
import { MessageFormatterService } from '@server/message/message-formatter.service';
import { MessageStreamProcessor } from './message-stream-processor';
import { StreamMessage } from './dto/sse-message.dto';
import { ErrorCode } from '@server/common/errors/error-codes';
import { CacheService } from '@server/cache/cache.service';
import { ThreadService } from '@server/thread/thread.service';
import { ThreadStatus } from '@server/thread/thread-status.enum';
import path from 'node:path';
import fs from 'node:fs';
import { uuid as uuidUtils } from '@common/utils';

@Injectable()
export class ChatService {
  // Redis 客户端（用于 List 和 Pub/Sub 操作）
  private redisClient: any;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly messageService: MessageService,
    private readonly agentService: AgentService,
    private readonly configService: ConfigService,
    private readonly messageFormatter: MessageFormatterService,
    private readonly cacheService: CacheService,
    private readonly threadService: ThreadService,
  ) {
    // 初始化 Redis 客户端（在模块初始化后）
    this.initializeRedisClient();
  }

  /**
   * 初始化 Redis 客户端
   */
  private async initializeRedisClient() {
    try {
      // 从 cache-manager 获取 Redis 客户端
      const cacheManager = (this.cacheService as any).cacheManager;
      if (cacheManager && cacheManager.store && cacheManager.store.getClient) {
        this.redisClient = cacheManager.store.getClient();
        this.logger.info('Redis client initialized from cache-manager');
      } else {
        this.logger.warn('Redis client not available, some features may not work');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Redis client', { error });
    }
  }

  async chat(res: Response, jwtPayload: JwtPayload, body: CreateChatDto) {
    const { threadId: threadUid, content } = body;
    const messageId = uuidUtils.generateMessageId();
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
    const listKey = `streaming:thread:${thread.uid}:messages`;
    const channel = `streaming:thread:${thread.uid}:channel`;
    const statusKey = `streaming:thread:${thread.uid}:status`;

    // 标记对话状态为进行中
    if (this.redisClient) {
      try {
        await this.redisClient.setex(statusKey, 3600, 'in_progress');
        await this.threadService.updateStatus(thread.uid, ThreadStatus.IN_PROGRESS);
        this.logger.info('Thread status set to IN_PROGRESS', { threadId: thread.uid });
      } catch (error) {
        this.logger.error('Failed to set thread status', { error, threadId: thread.uid });
      }
    }

    if (!isMockMode) {
      this.saveMessageToMockFile(source$, isMockMode);
    }
    this.saveMessageToDatabase(source$, thread);
    this.transmitMessageToClient(source$, res, listKey, channel, statusKey);
  }

  private async transmitMessageToClient(
    source$: Observable<StreamMessage>,
    res: Response,
    listKey: string,
    channel: string,
    statusKey: string,
  ) {
    source$.subscribe({
      next: async (sseMessage) => {
        // 1. 写入客户端 SSE
        res.write(this.messageFormatter.serializeToSSE(sseMessage));

        // 2. 写入 Redis List 缓存（历史）
        // 3. 发布到 Pub/Sub 通道（实时）
        if (this.redisClient) {
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
                this.redisClient.rpush(listKey, messageStr),
                this.redisClient.publish(channel, messageStr),
              ]);

              // 设置 TTL
              await this.redisClient.expire(listKey, 3600);
            }
          } catch (error) {
            this.logger.error('Failed to cache message to Redis', {
              error,
              threadId: res.req?.params?.threadId,
              messageType: sseMessage.type,
            });
          }
        }
      },

      complete: async () => {
        // 对话完成，标记状态
        if (this.redisClient) {
          try {
            await this.redisClient.setex(statusKey, 3600, 'completed');
            await this.threadService.updateStatus(res.req?.params?.threadId || '', ThreadStatus.COMPLETED);

            // 发布完成事件到 control channel
            await this.redisClient.publish(`${channel}:control`, 'complete');

            this.logger.info('Thread status set to COMPLETED', { threadId: res.req?.params?.threadId });
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
        this.logger.error('Stream error', { error: err, threadId: res.req?.params?.threadId });

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
    const listKey = `streaming:thread:${threadId}:messages`;
    const channel = `streaming:thread:${threadId}:channel`;
    const sentMessageUids = new Set<string>(); // 记录已发送消息的 UID

    return new Observable((subscriber) => {
      let pubSubClient: any | null = null;
      let isInitialized = false;
      let unsubscribe: (() => void) | null = null;

      const cleanup = () => {
        if (unsubscribe) {
          unsubscribe();
        }
        if (pubSubClient && typeof pubSubClient.quit === 'function') {
          pubSubClient.quit();
        }
        sentMessageUids.clear();
      };

      (async () => {
        try {
          if (!this.redisClient) {
            subscriber.error(new Error('Redis client not available'));
            cleanup();
            return;
          }

          // 步骤 0: 立即订阅 Pub/Sub，暂存消息
          pubSubClient = (this.redisClient as any).duplicate
            ? (this.redisClient as any).duplicate()
            : this.redisClient;

          const newMessageBuffer: any[] = [];

          // 订阅消息通道
          const messageHandler = (message: string) => {
            try {
              const msg = JSON.parse(message);
              if (!isInitialized) {
                newMessageBuffer.push(msg);
              } else {
                if (!sentMessageUids.has(msg.id)) {
                  subscriber.next(msg);
                  sentMessageUids.add(msg.id);
                }
              }
            } catch (e) {
              this.logger.error('Parse pub/sub message failed', { error: e, threadId });
            }
          };

          await pubSubClient.subscribe(channel, messageHandler);

          // 等待订阅生效
          await new Promise((resolve) => setTimeout(resolve, 50));

          // 步骤 1: 第一次读取 List（历史）
          const history1 = await this.redisClient.lrange(listKey, 0, -1);
          const historyCount1 = history1.length;

          // 发送历史消息（从旧到新）
          for (const msgStr of history1) {
            try {
              const msg = JSON.parse(msgStr);
              if (!sentMessageUids.has(msg.id)) {
                subscriber.next(msg);
                sentMessageUids.add(msg.id);
              }
            } catch (e) {
              this.logger.error('Parse history message failed', { error: e, threadId });
            }
          }

          // 步骤 2: 第二次读取 List，检查新增消息
          await new Promise((resolve) => setTimeout(resolve, 100));

          const history2 = await this.redisClient.lrange(listKey, 0, -1);
          const historyCount2 = history2.length;

          if (historyCount2 > historyCount1) {
            // 有新消息加入（窗口期间写入的）
            const newlyAdded = history2.slice(historyCount1);

            for (const msgStr of newlyAdded) {
              try {
                const msg = JSON.parse(msgStr);
                if (!sentMessageUids.has(msg.id)) {
                  subscriber.next(msg);
                  sentMessageUids.add(msg.id);
                }
              } catch (e) {
                this.logger.error('Parse newly added message failed', { error: e, threadId });
              }
            }
          }

          // 步骤 3: 处理订阅期间缓存的消息
          isInitialized = true;

          for (const msg of newMessageBuffer) {
            if (!sentMessageUids.has(msg.id)) {
              subscriber.next(msg);
              sentMessageUids.add(msg.id);
            }
          }

          // 订阅控制通道（用于接收 complete 事件）
          const controlChannel = `${channel}:control`;
          const controlHandler = (message: string) => {
            if (message === 'complete') {
              this.logger.info('Received complete event from control channel', { threadId });

              // 延迟3秒确保所有消息已接收
              setTimeout(() => {
                subscriber.complete();
                cleanup();
              }, 3000);
            }
          };

          await pubSubClient.subscribe(controlChannel, controlHandler);

          this.logger.info('Restore connection established', { threadId });
        } catch (error) {
          this.logger.error('Restore failed', { error, threadId });
          subscriber.error(error);
          cleanup();
        }
      })();

      // 返回清理函数
      return cleanup;
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
