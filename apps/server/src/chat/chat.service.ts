import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CreateChatDto } from './dto/create-chat.dto';
import { MessageService } from '@server/message/message.service';
import { JwtPayload } from '@server/auth/auth.service';
import { AgentService } from '@server/agent/agent.service';
import { AIMessage, AIMessageChunk } from '@langchain/core/messages';
import { ConfigService } from '@nestjs/config';
import path from 'node:path';
import fs from 'node:fs';
import readline from 'node:readline';
import { nanoid } from 'nanoid';
import { streamUtils } from '@server/utils';

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

    let stream: AsyncIterable<unknown>;

    // 开发环境下优先走本地 mock 文件，减少 API 成本
    if (isDev && mockEnable) {
      stream = this.streamMockSSE(res);
    } else {
      const agentStream = await this.agentService.run({
        thread,
        memory,
        message,
      });
      stream = streamUtils.asyncIterableToGenerator(agentStream);
    }

    let mergedMessage = '';
    for await (const line of stream) {
      const data = streamUtils.parseSSEMessage(
        line as `data: ${string}`,
      ) as AIMessageChunk;
      if (data) {
        mergedMessage += data.content;
      }
      res.write(line);
    }
    res.end();

    // TODO
    await this.messageService.appendMessage(thread, [
      new AIMessage(mergedMessage),
    ]);
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

  private async *streamMockSSE(res: Response): AsyncIterable<string> {
    try {
      const mockPath = this.configService.get('mock.path') ?? './mock';
      const filePath = path.join(mockPath, 'chat.txt');
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`SSE mock file not found at ${filePath}`);
        return;
      }

      const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
      const rl = readline.createInterface({
        input: readStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        yield line + '\n';
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (error) {
      this.logger.error('Failed to stream SSE from mock file', { error });
    }
  }
}
