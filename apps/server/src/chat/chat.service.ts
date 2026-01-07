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
import { ThreadMessageBufferService } from '@server/thread/thread-message-buffer.service';
import path from 'node:path';
import fs from 'node:fs';
import { uuid } from '@common/utils';

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
    private readonly threadMessageBuffer: ThreadMessageBufferService,
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
    this.saveMessageToBuffer(source$, thread);
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
   * 保存消息到 Thread Message Buffer
   * @param source$
   * @param thread
   */
  private async saveMessageToBuffer(
    source$: Observable<StreamMessage>,
    thread: Thread,
  ) {
    // 初始化 thread buffer（清理旧数据）
    await this.threadMessageBuffer.initializeThread(thread.uid).catch((error) => {
      this.logger.warn('Failed to initialize thread buffer', {
        error,
        threadUid: thread.uid,
      });
    });

    source$.subscribe({
      next: async (sseMessage) => {
        // 推送消息到 buffer
        try {
          await this.threadMessageBuffer.pushMessage(thread.uid, sseMessage);
          this.logger.debug(
            `Message saved to buffer for thread ${thread.uid}`,
          );
        } catch (error) {
          this.logger.error('Failed to save message to buffer', {
            error,
            threadUid: thread.uid,
            message: sseMessage,
          });
        }
      },
      complete: async () => {
        // 对话完成后，清理 buffer（异步执行，延迟清理）
        const autoCleanup = this.configService.get(
          'thread.buffer.autoCleanup',
          true,
        );
        if (autoCleanup) {
          // 延时清理 buffer
          const cleanupDelayMs = this.configService.get(
            'thread.buffer.cleanupDelayMs',
            5000,
          );
          setTimeout(
            () => {
              this.threadMessageBuffer
                .cleanupThread(thread.uid)
                .catch((error) => {
                  this.logger.warn('Failed to cleanup thread buffer', {
                    error,
                    threadUid: thread.uid,
                  });
                });
            },
            cleanupDelayMs,
          );
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

      // 2. 从 buffer 恢复消息并订阅实时流
      const source$ = this.getHistoryAndSubscribe(threadUid, jwtPayload.uid);

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
   * 从 buffer 获取历史消息并订阅实时流
   * 返回 Observable 来流式传输历史消息和实时消息
   *
   * 实现说明：
   * - 先从数据库读取历史消息
   * - 然后订阅实时消息流
   * - 使用 concat 合并两个流
   */
  private getHistoryAndSubscribe(
    threadUid: string,
    _userUid: string,
  ): Observable<StreamMessage> {
    const messageSubject = new Subject<StreamMessage>();

    this.logger.info(`Restoring thread ${threadUid} from message buffer`);

    // 异步加载历史消息并订阅实时流
    this.restoreThreadMessages(threadUid, messageSubject);

    // 返回 Observable
    return new Observable<StreamMessage>((observer) => {
      const subscription = messageSubject.subscribe({
        next: (msg) => observer.next(msg),
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });

      // 当取消订阅时，清理
      return () => {
        subscription.unsubscribe();
        messageSubject.complete();
        this.logger.debug(`Restore completed for thread ${threadUid}`);
      };
    });
  }

  /**
   * 恢复 thread 消息（历史 + 实时）
   */
  private async restoreThreadMessages(
    threadUid: string,
    messageSubject: Subject<StreamMessage>,
  ): Promise<void> {
    try {
      // 1. 从 buffer 获取历史消息
      const historyMessages =
        await this.threadMessageBuffer.getHistory(threadUid);

      this.logger.debug(
        `Found ${historyMessages.length} historical messages for thread ${threadUid}`,
      );

      // 2. 发送历史消息
      for (const message of historyMessages) {
        messageSubject.next(message);
      }

      // 3. 订阅实时消息流
      const realtimeStream$ = this.threadMessageBuffer.subscribe(threadUid);

      // 4. 转发实时消息到 Subject
      realtimeStream$.subscribe({
        next: (message) => {
          messageSubject.next(message);
        },
        error: (error) => {
          this.logger.error(
            `Error in realtime stream for thread ${threadUid}`,
            { error },
          );
          messageSubject.error(error);
        },
        complete: () => {
          this.logger.debug(`Realtime stream completed for thread ${threadUid}`);
          messageSubject.complete();
        },
      });

      this.logger.debug(`Realtime stream started for thread ${threadUid}`);
    } catch (error) {
      this.logger.error(`Failed to restore thread messages`, {
        error,
        threadUid,
      });
      messageSubject.error(error);
    }
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
