import { Injectable } from '@nestjs/common';
import { JwtPayload } from '@server/auth/auth.service';
import { MessageService } from '@server/message/message.service';
import { MessageFormatterService } from '@server/message/message-formatter.service';
import { PrismaService } from '@server/prisma/prisma.service';
import { generateThreadId } from '@common/utils/uuid';
import { ThreadStatus } from './thread-status.enum';

@Injectable()
export class ThreadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messageService: MessageService,
    private readonly messageFormatter: MessageFormatterService,
  ) {}

  async createThread(userId: string) {
    const thread = await this.prisma.db.thread.create({
      data: {
        uid: generateThreadId(),
        userUid: userId,
        title: null,
        totalTokens: 0,
        status: ThreadStatus.COMPLETED, // 新建线程默认已完成/已结束
      },
    });

    return thread;
  }

  async getThreads(userId: string) {
    const threads = await this.prisma.db.thread.findMany({
      where: {
        userUid: userId,
      },
      select: {
        id: true,
        uid: true,
        title: true,
        messageCount: true,
        totalTokens: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return threads;
  }

  async deleteThread(userId: string, id: number) {
    const result = await this.prisma.db.thread.delete({
      where: {
        id,
        userUid: userId,
      },
    });

    return result;
  }

  async getThreadMessages(user: JwtPayload, id: string) {
    const messages = await this.messageService.getHistoryByThread(id);
    const streamMessages = this.messageFormatter.toStreamMessages(messages);

    return streamMessages;
  }

  /**
   * 更新 Thread 的 status 状态
   */
  async updateStatus(
    threadId: string,
    status: ThreadStatus,
  ): Promise<void> {
    try {
      await this.prisma.db.thread.update({
        where: { uid: threadId },
        data: { status },
      });
    } catch (error) {
      console.error('Failed to update thread status', { error, threadId, status });
    }
  }

  /**
   * 获取单个 Thread 详情
   */
  async getThreadDetail(userId: string, threadId: string) {
    const thread = await this.prisma.db.thread.findFirst({
      where: {
        uid: threadId,
        userUid: userId,
      },
      select: {
        id: true,
        uid: true,
        title: true,
        messageCount: true,
        totalTokens: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return thread;
  }
}
