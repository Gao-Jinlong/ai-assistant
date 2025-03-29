import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import {
  CreateConversationDto,
  MessageDto,
} from './dto/create-conversation.dto';
import { StorageService } from '@server/storage/storage.service';
import { ClsService } from 'nestjs-cls';
import { $Enums, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { generateUid } from '@server/utils/uid';
import dayjs from 'dayjs';
import { TRPCError } from '@trpc/server';
import { GeneralAgent } from '@server/llm/agent/general-agent';
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { IStorageProvider } from '@server/storage/interfaces/storage.interface';
import { CLS_CONVERSATION, CLS_STORAGE_PROVIDER } from '@server/constant';
declare module 'nestjs-cls' {
  interface ClsStore {
    [CLS_CONVERSATION]: Prisma.ConversationGetPayload<object> | null;
    [CLS_STORAGE_PROVIDER]: IStorageProvider | null;
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

  // TODO 解耦创建对话的步骤，创建 history 存储，然后传递给 llm 使用
  async create({ messages, ...rest }: CreateConversationDto) {
    const user = this.cls.get('user')!;

    const data: Prisma.ConversationCreateInput = {
      uid: generateUid(),
      ...rest,
      userUid: user.id,
      storageType: $Enums.StorageType.LOCAL,
      storagePath: `${this.config.get('storage.basePath')}/${generateUid(dayjs().format('YYYY-MM-DD_HH-MM-SS'))}.json`,
      status: $Enums.ConversationStatus.ACTIVE,
      messageCount: messages?.length || 0,
    };
    try {
      const provider = await this.storageService.createProvider({
        type: 'local',
        path: data.storagePath,
      });

      const ms = messages?.map((message) => new HumanMessage(message.content));
      if (ms) {
        await provider.addMessages(ms);
      }

      const conversation = await this.prisma.db.conversation.create({
        data,
      });

      this.cls.set(CLS_CONVERSATION, conversation);
      this.cls.set(CLS_STORAGE_PROVIDER, provider);

      return conversation;
    } catch (error) {
      console.log('🚀 ~ ConversationService ~ create ~ error:', error);
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
    const result = await this.prisma.db.conversation.findUnique({
      where: { uid: conversationUid },
    });
    if (!result) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Conversation not found',
      });
    }

    const messages = await this.cls.get('storageProvider')?.getMessages();

    return {
      ...result,
      messages: messages?.map((message) => message.content),
    };
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

  async appendMessage(conversationUid: string, inputMessage: MessageDto) {
    const conversation = await this.prisma.db.conversation.findUnique({
      where: { uid: conversationUid },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    let message: BaseMessage;
    switch (inputMessage.role) {
      case 'user':
        message = new HumanMessage(inputMessage.content);
        break;
      case 'ai':
        message = new AIMessage(inputMessage.content);
        break;
      case 'system':
        message = new SystemMessage(inputMessage.content);
        break;
      default:
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid message role',
        });
    }
    // TODO 注入 storageProvider
    await this.cls.get(CLS_STORAGE_PROVIDER)?.addMessage(message);

    // 更新会话元数据
    await this.prisma.db.conversation.update({
      where: { uid: conversationUid },
      data: {
        messageCount: { increment: 1 },
      },
    });
  }

  async getMessages(conversationUid: string) {
    const conversation = await this.prisma.db.conversation.findUnique({
      where: { uid: conversationUid },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    try {
      const data = await this.cls.get(CLS_STORAGE_PROVIDER)?.getMessages();
      return data?.map((message) => message.content);
    } catch (error) {
      console.error('Failed to read messages:', error);
      return { messages: [] };
    }
  }
}
