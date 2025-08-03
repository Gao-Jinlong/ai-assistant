import { Inject, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '@server/prisma/prisma.service';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CreateChatDto } from './dto/create-chat.dto';
import { MessageService } from '@server/message/message.service';
import { JwtPayload } from '@server/auth/auth.service';
import { AgentService } from '@server/agent/agent.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,

    private readonly messageService: MessageService,
    private readonly agentService: AgentService,
  ) {}

  async sseMessages(
    res: Response,
    jwtPayload: JwtPayload,
    body: CreateChatDto,
  ) {
    const { threadUid, message: userMessage } = body;

    const thread = await this.prisma.db.thread.findUnique({
      where: { uid: threadUid },
    });

    this.agentService.run(thread);
  }
}
