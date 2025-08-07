import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CreateChatDto } from './dto/create-chat.dto';
import { MessageService } from '@server/message/message.service';
import { JwtPayload } from '@server/auth/auth.service';
import { AgentService } from '@server/agent/agent.service';
import {
  AIMessage,
  AIMessageChunk,
  isAIMessageChunk,
} from '@langchain/core/messages';
import { ConfigService } from '@nestjs/config';
import path from 'node:path';
import fs from 'node:fs';
import { chatUtils } from '@server/utils';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,

    private readonly messageService: MessageService,
    private readonly agentService: AgentService,
    private readonly configService: ConfigService,
  ) {}

  async chat(res: Response, jwtPayload: JwtPayload, body: CreateChatDto) {
    const { threadUid, message } = body;
    // const { uid, email } = jwtPayload;

    const thread = await this.prisma.db.thread.findUnique({
      where: { uid: threadUid },
    });
    if (!thread) {
      throw new BadRequestException('Thread not found');
    }

    const memory = await this.messageService.getHistoryByThread(thread.uid);

    const stream = await this.agentService.run({ thread, memory, message });

    const mockPath = this.configService.get('mock.path') ?? './mock';
    const file = fs.createWriteStream(path.join(mockPath, 'chat.txt'));

    for await (const [message, _metadata] of stream) {
      const formattedMessage = chatUtils.formatMessage(message);
      const finalMessage = 'data: ' + JSON.stringify(formattedMessage) + '\n\n';
      res.write(finalMessage);
      file.write(finalMessage);
    }

    res.end();
  }

  processAIMessageChunk(res: Response, message: AIMessageChunk) {
    const { content, tool_call_chunks, ...rest } = message;

    if (tool_call_chunks?.length) {
      return;
    } else {
      return {
        content,
        tool_call_chunks,
        ...rest,
      };
    }
  }
}
