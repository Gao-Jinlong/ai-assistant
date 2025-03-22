import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import {
  CreateConversationDto,
  MessageDto,
} from './dto/create-conversation.dto';
import { StorageService } from '@server/storage/storage.service';
import { ClsService } from 'nestjs-cls';
import { $Enums, Prisma } from '@prisma/client';
import { omit } from 'es-toolkit';
import { ConfigService } from '@nestjs/config';
import { generateUid } from '@server/utils/uid';
import dayjs from 'dayjs';
import { TRPCError } from '@trpc/server';
import { GeneralAgent } from '@server/llm/agent/general-agent';
declare module 'nestjs-cls' {
  interface ClsStore {
    conversation: Prisma.ConversationGetPayload<object> | null;
  }
}
@Injectable()
export class ConversationService {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
    private readonly config: ConfigService,
    private readonly generalAgent: GeneralAgent,
  ) {}

  async create({ messages, ...rest }: CreateConversationDto) {
    const user = this.cls.get('user')!;

    const data: Prisma.ConversationCreateInput = {
      uid: generateUid(),
      ...rest,
      userUid: user.id,
      storageType: $Enums.StorageType.LOCAL,
      storagePath: `${generateUid(dayjs().format('YYYY-MM-DD'))}.json`,
      status: $Enums.ConversationStatus.ACTIVE,
      messageCount: messages?.length || 0,
    };
    try {
      // TODO 使用 langchain 的工具，重新设计存储和 langchain 的交互
      await this.storageService.write(
        data.storagePath,
        JSON.stringify({
          messages: messages?.map((message) => ({
            ...message,
            createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          })),
        }),
      );

      const conversation = await this.prisma.db.conversation.create({
        data,
      });

      this.cls.set('conversation', conversation);

      const messagesStr = messages
        ?.map((message) => message.content)
        .join('\n');
      if (!messagesStr) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Messages are required',
        });
      }
      const generalAgentResponse = await this.generalAgent.invoke(messagesStr);

      return generalAgentResponse;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create conversation',
      });
    }
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
