import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CreateChatDto } from './dto/create-chat.dto';
import { MessageService } from '@server/message/message.service';
import { JwtPayload } from '@server/auth/auth.service';
import { AgentService } from '@server/agent/agent.service';
import { AIMessageChunk } from '@langchain/core/messages';
import { ConfigService } from '@nestjs/config';
import path from 'node:path';
import fs from 'node:fs';
import readline from 'node:readline';
import { chatUtils } from '@server/utils';
import { nanoid } from 'nanoid';
import { MESSAGE_ROLE } from '@server/interface';

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
    /**
     * 本组对话 id，用于区分不同对话
     */
    const groupId = nanoid();

    const isDev = this.configService.get('isDev');
    const mockEnable = this.configService.get('mock.enable');

    const thread = await this.prisma.db.thread.findUnique({
      where: { uid: threadUid },
    });
    if (!thread) {
      throw new BadRequestException('Thread not found');
    }

    const memory = await this.messageService.getHistoryByThread(thread.uid);

    // 开发环境下优先走本地 mock 文件，减少 API 成本
    if (isDev && mockEnable) {
      const used = await this.streamMockSSE(res);
      if (used) {
        res.end();
        return;
      }
      // 如果 mock 文件不可用则回退到真实流
    }

    const stream = await this.agentService.run({ thread, memory, message });

    const mockPath = this.configService.get('mock.path') ?? './mock';
    const file = fs.createWriteStream(path.join(mockPath, 'chat.txt'));

    for await (const [message, _metadata] of stream) {
      const formattedMessage = chatUtils.formatMessage(
        message,
        groupId,
        MESSAGE_ROLE.ASSISTANT,
      );
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

  private async streamMockSSE(res: Response): Promise<boolean> {
    try {
      const mockPath = this.configService.get('mock.path') ?? './mock';
      const filePath = path.join(mockPath, 'chat.txt');
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`SSE mock file not found at ${filePath}`);
        return false;
      }

      const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
      const rl = readline.createInterface({
        input: readStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        // 原样按行写回，包括空行，确保符合 SSE 的 "\n\n" 分隔
        res.write(line + '\n');
        // 轻微延迟，模拟流式返回
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
      }

      return true;
    } catch (error) {
      this.logger.error('Failed to stream SSE from mock file', { error });
      return false;
    }
  }
}
