import { Injectable } from '@nestjs/common';
import { BaseMessage } from '@langchain/core/messages';
import { Thread } from '@prisma/client';
import { PrismaService } from '@server/prisma/prisma.service';
import { generateMessageId } from '@common/utils/uuid';
@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async appendMessage(thread: Thread, data: BaseMessage[]) {
    const messages = data.map((item) => {
      return {
        uid: generateMessageId(),
        content: item.content.toString(),
        role: item.type,
        threadUid: thread.uid,
      };
    });

    const result = await this.prisma.db.message.createMany({
      data: messages,
    });

    return result;
  }

  async getHistoryByThread(threadUid: Thread['uid']) {
    const messages = await this.prisma.db.message.findMany({
      where: {
        threadUid,
        deleted: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages;
  }
}
