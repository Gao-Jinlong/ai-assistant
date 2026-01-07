import { Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Subject, Observable } from 'rxjs';
import { StreamMessage } from '@server/chat/dto/sse-message.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { Logger as WinstonLogger } from 'winston';
import { PrismaClient } from 'generated/prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * ThreadMessageBufferService
 *
 * 替代 Kafka 的对话暂存服务：
 * - 使用 PostgreSQL 持久化存储消息
 * - 使用 RxJS Subject 实现毫秒级实时推送
 * - 自动清理对话完成后的暂存数据
 *
 * 注意：此服务使用独立的 PrismaClient 实例，绕过 PrismaService 的扩展层
 * 因为扩展层可能导致模型访问问题
 */
@Injectable()
export class ThreadMessageBufferService {
  private readonly logger: WinstonLogger;
  private readonly prismaClient: PrismaClient;

  // 内存中管理每个 thread 的 Subject（用于实时推送）
  private readonly threadSubjects = new Map<string, Subject<StreamMessage>>();

  // 跟踪每个 thread 的消息序号
  private readonly messageIndexes = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) logger: WinstonLogger,
    private readonly configService: ConfigService,
  ) {
    this.logger = logger;

    // 创建独立的 PrismaClient 实例，绕过扩展层
    const connectionString = this.configService.get('DATABASE_URL');
    this.prismaClient = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    }) as any;
  }

  /**
   * 初始化 thread（清理旧的 buffer 数据）
   * 在新对话开始时调用
   */
  async initializeThread(threadUid: string): Promise<void> {
    this.logger.debug(`Initializing thread buffer: ${threadUid}`);

    try {
      // 清理旧的 buffer 数据（如果有）
      const db = this.prismaClient as any;
      await db.threadMessageBuffer.deleteMany({
        where: { threadUid },
      });

      // 重置消息序号
      this.messageIndexes.set(threadUid, 0);

      this.logger.debug(`Thread buffer initialized: ${threadUid}`);
    } catch (error) {
      this.logger.error(`Failed to initialize thread buffer: ${threadUid}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * 推送消息到 buffer
   * 1. 写入数据库（持久化）
   * 2. 推送到所有订阅者（实时）
   */
  async pushMessage(
    threadUid: string,
    message: StreamMessage,
  ): Promise<void> {
    try {
      // 获取当前消息序号
      const currentIndex =
        this.messageIndexes.get(threadUid) ?? await this.getNextIndexFromDB(threadUid);

      // 写入数据库
      const db = this.prismaClient as any;
      await db.threadMessageBuffer.create({
        data: {
          threadUid,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messageData: message as any, // Prisma Json 字段需要 any 类型
          messageIndex: currentIndex,
        },
      });

      // 更新内存中的序号
      this.messageIndexes.set(threadUid, currentIndex + 1);

      // 获取或创建 Subject
      let subject = this.threadSubjects.get(threadUid);
      if (!subject) {
        subject = new Subject<StreamMessage>();
        this.threadSubjects.set(threadUid, subject);
      }

      // 推送到所有订阅者
      subject.next(message);

      this.logger.debug(`Message pushed to buffer for thread: ${threadUid}`, {
        messageIndex: currentIndex,
        messageType: message.type,
      });
    } catch (error) {
      this.logger.error(`Failed to push message to buffer: ${threadUid}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        message: {
          id: message.id,
          type: message.type,
        },
      });
      throw error;
    }
  }

  /**
   * 获取历史消息
   * 从数据库读取该 thread 的所有暂存消息
   */
  async getHistory(threadUid: string): Promise<StreamMessage[]> {
    try {
      const db = this.prismaClient as any;
      const buffers = await db.threadMessageBuffer.findMany({
        where: { threadUid },
        orderBy: { messageIndex: 'asc' },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages = buffers.map((buffer: any) => {
        const message = buffer.messageData as StreamMessage;
        return message;
      });

      this.logger.debug(`Retrieved ${messages.length} messages from buffer`, {
        threadUid,
      });

      return messages;
    } catch (error) {
      this.logger.error(`Failed to get history from buffer: ${threadUid}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * 订阅实时消息流
   * 返回 Observable，订阅后会接收到新消息
   */
  subscribe(threadUid: string): Observable<StreamMessage> {
    this.logger.debug(`New subscription to thread: ${threadUid}`);

    // 获取或创建 Subject
    let subject = this.threadSubjects.get(threadUid);
    if (!subject) {
      subject = new Subject<StreamMessage>();
      this.threadSubjects.set(threadUid, subject);
    }

    // 返回 Observable
    return subject.asObservable();
  }

  /**
   * 清理 thread 数据
   * 对话完成后调用
   */
  async cleanupThread(threadUid: string): Promise<void> {
    this.logger.debug(`Cleaning up thread buffer: ${threadUid}`);

    try {
      // 删除数据库记录
      const db = this.prismaClient as any;
      await db.threadMessageBuffer.deleteMany({
        where: { threadUid },
      });

      // 完成 Subject 并从内存中移除
      const subject = this.threadSubjects.get(threadUid);
      if (subject) {
        subject.complete();
        this.threadSubjects.delete(threadUid);
      }

      // 清理消息序号
      this.messageIndexes.delete(threadUid);

      this.logger.debug(`Thread buffer cleaned up: ${threadUid}`);
    } catch (error) {
      this.logger.error(`Failed to cleanup thread buffer: ${threadUid}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * 从数据库获取下一个消息序号
   */
  private async getNextIndexFromDB(threadUid: string): Promise<number> {
    try {
      const db = this.prismaClient as any;
      const lastMessage = await db.threadMessageBuffer.findFirst({
        where: { threadUid },
        orderBy: { messageIndex: 'desc' },
      });

      return (lastMessage?.messageIndex ?? -1) + 1;
    } catch (error) {
      this.logger.error(
        `Failed to get next index from DB for thread: ${threadUid}`,
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      return 0;
    }
  }

  /**
   * 检查 thread 是否有活跃的订阅者
   */
  hasActiveSubscribers(threadUid: string): boolean {
    const subject = this.threadSubjects.get(threadUid);
    return subject !== undefined;
  }
}
