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
import {
  IStorageProvider,
  StorageOptions,
} from '@server/storage/interfaces/storage.interface';
import { CLS_CONVERSATION, CLS_STORAGE_PROVIDER } from '@server/constant';
import { omit } from 'es-toolkit';
import { LlmService } from '@server/llm/llm.service';
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
      const conversation = await this.createConversation(data);

      await this.getStorageProvider({
        type: $Enums.StorageType.LOCAL,
        path: data.storagePath,
      });

      return conversation;
    } catch (error) {
      console.log('🚀 ~ ConversationService ~ create ~ error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create conversation',
      });
    }
  }

  async appendMessage(conversationUid: string, inputMessage: MessageDto) {
    try {
      const conversation = await this.getConversation(conversationUid);

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

      const storageProvider = await this.getStorageProvider({
        type: conversation.storageType as typeof $Enums.StorageType.LOCAL,
        path: conversation.storagePath,
      });

      await storageProvider.addMessage(message);
      // 更新会话元数据
      const meta = await this.prisma.db.conversation.update({
        where: { uid: conversationUid },
        data: {
          messageCount: { increment: 1 },
        },
      });

      const response = await this.generateResponse(message);

      return {
        conversation: omit(meta, ['storagePath', 'storageType']),
        message: response.response,
      };
    } catch (error) {
      console.log('🚀 ~ ConversationService ~ appendMessage ~ error:', error);
    }
  }

  async generateResponse(message: BaseMessage) {
    const conversation = this.cls.get(CLS_CONVERSATION)!;
    const storageProvider = this.cls.get(CLS_STORAGE_PROVIDER)!;

    // 获取历史消息
    const history = await storageProvider.getMessages();

    // 构建完整的消息列表
    const messages = [...history, message];

    // 调用 LLM 获取响应
    const response = await this.generalAgent.invoke({
      conversation,
      messages: messages,
    });

    // 保存 AI 响应到历史记录
    const aiMessage = new AIMessage(response.response);
    await storageProvider.addMessage(aiMessage);

    return response;
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
  async createConversation(data: Prisma.ConversationCreateInput) {
    let conversation = this.cls.get(CLS_CONVERSATION);
    if (!conversation) {
      conversation = await this.prisma.db.conversation.create({
        data,
      });
      this.cls.set(CLS_CONVERSATION, conversation);
    }
    return conversation;
  }
  async getConversation(conversationUid: string) {
    let conversation = this.cls.get(CLS_CONVERSATION);

    if (!conversation) {
      conversation = await this.prisma.db.conversation.findUnique({
        where: { uid: conversationUid },
      });
      this.cls.set(CLS_CONVERSATION, conversation);
    }

    return conversation;
  }
  async getStorageProvider(options: StorageOptions) {
    let provider = this.cls.get(CLS_STORAGE_PROVIDER);
    if (!provider) {
      provider = await this.storageService.createProvider(options);
      this.cls.set(CLS_STORAGE_PROVIDER, provider);
    }
    return provider;
  }
}
