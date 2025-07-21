import { Injectable } from '@nestjs/common';
import { StorageType } from '@prisma/client';
import { PrismaService } from '@server/prisma/prisma.service';
import { generateUid } from '@server/utils/uid';

@Injectable()
export class ThreadService {
  constructor(private readonly prisma: PrismaService) {}

  async mockDataInit() {
    const user = await this.prisma.db.user.findFirst({});

    if (!user) {
      throw new Error('User not found');
    }

    await this.createThread(user.uid);
    await this.createThread(user.uid);
    await this.createThread(user.uid);
    await this.createThread(user.uid);
    await this.createThread(user.uid);
    await this.createThread(user.uid);
    await this.createThread(user.uid);
    await this.createThread(user.uid);
  }

  // TODO: 用户发送消息后自动创建会话，并返回会话ID
  async createThread(userId: string) {
    const thread = await this.prisma.db.thread.create({
      data: {
        uid: generateUid('thread'),
        userUid: userId,
        title: null,
        storageType: StorageType.LOCAL,
        storagePath: 'threads',
        totalTokens: 0,
      },
    });

    return thread;
  }

  async getThreads(userId: string) {
    console.log('🚀 ~ ThreadService ~ getThreads ~ userId:', userId);
    const threads = await this.prisma.db.thread.findMany({
      where: {
        userUid: userId,
      },
      select: {
        id: true,
        uid: true,
        title: true,
      },
    });

    return threads;
  }
}
