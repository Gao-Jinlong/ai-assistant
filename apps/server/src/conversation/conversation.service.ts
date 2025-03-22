import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { StorageService } from '@server/storage/storage.service';
import { ClsService } from 'nestjs-cls';
import { $Enums, Prisma, PrismaClient } from '@prisma/client';
import { omit } from 'es-toolkit';
import { ConfigService } from '@nestjs/config';

declare module 'nestjs-cls' {
  interface ClsStore {
    conversation: Prisma.ConversationGetPayload<{}> | null;
  }
}
@Injectable()
export class ConversationService {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateConversationDto) {
    const user = this.cls.get('user')!;

    const data = {
      uid: '',
      ...dto,
      userUid: user.id,
      storageType: $Enums.StorageType.LOCAL,
      storagePath: this.config.get('storage.basePath'),
      status: $Enums.ConversationStatus.ACTIVE,
    };

    const conversation = await this.prisma.db.conversation.create({
      data,
    });

    this.cls.set('conversation', conversation);

    return omit(conversation, ['deleted', 'updatedAt']);
  }

  // TODO 分页
  async findAll() {
    const result = await this.prisma.db.conversation.findMany();
    return result;
  }

  async findOne(conversationUid: string) {
    return await this.prisma.db.conversation.findUnique({
      where: { uid: conversationUid },
    });
  }

  async remove(conversationUid: string) {
    const result = await this.prisma.db.conversation.update({
      where: { uid: conversationUid },
      data: {
        deleted: true,
      },
    });

    if (!result) {
      throw new NotFoundException('Conversation not found');
    }

    return 1;
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
