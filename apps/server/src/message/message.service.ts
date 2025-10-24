import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { Injectable } from '@nestjs/common';
import { Thread } from '@prisma/client';
import { PrismaService } from '@server/prisma/prisma.service';
import { generateUid } from '@server/utils/uid';
@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async appendMessage(thread: Thread, data: BaseMessage[]) {
    const messages = data.map((item) => {
      return {
        uid: generateUid('message'),
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

  async getHistoryByThread(threadUid: Thread['uid']): Promise<BaseMessage[]> {
    const messages = await this.prisma.db.message.findMany({
      where: {
        threadUid,
        deleted: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const memory = messages.map((item) => {
      if (item.role === 'user') {
        return new HumanMessage(item.content);
      } else {
        return new AIMessage(item.content);
      }
    });

    return memory;
  }
}
