import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { StorageService } from '@server/storage/storage.service';

@Injectable()
export class ConversationService {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  // TODO 通用 nest-cls 存储会话的文件信息
  async create(dto: CreateConversationDto) {
    const conversation = await this.prisma.db.conversation.create({
      data: {
        uid: '',
        ...dto,
      },
    });

    return conversation;
  }

  async appendMessage(conversationUid: string, message: any) {
    const conversation = await this.prisma.db.conversation.findUnique({
      where: { uid: conversationUid },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // 追加消息到存储
    const content = JSON.stringify(message) + '\n';
    await this.storageService.append(conversation.storagePath, content);

    // 更新会话元数据
    await this.prisma.db.conversation.update({
      where: { uid: conversationUid },
      data: {
        messageCount: { increment: 1 },
        lastMessage: message.content,
        totalTokens: { increment: message.tokens || 0 },
        totalLatency: { increment: message.latency || 0 },
      },
    });
  }
}
