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
  AIMessageChunk,
  type BaseMessage,
  type BaseMessageChunk,
} from '@langchain/core/messages';
import { ConfigService } from '@nestjs/config';
import path from 'node:path';
import fs from 'node:fs';
import readline from 'node:readline';
import { streamUtils } from '@server/utils';
import { Thread } from '@prisma/client';
import { from, share, type Observable } from 'rxjs';

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

    const isDev = this.configService.get('isDev');
    const mockEnable = this.configService.get('mock.enable');

    const thread = await this.prisma.db.thread.findUnique({
      where: { uid: threadUid },
    });
    if (!thread) {
      throw new BadRequestException('Thread not found');
    }

    const memory = await this.messageService.getHistoryByThread(thread.uid);

    let stream: AsyncIterable<BaseMessageChunk>;

    // 开发环境下优先走本地 mock 文件，减少 API 成本
    if (isDev && !mockEnable) {
      stream = this.streamMockSSE();
    } else {
      const agentStream = await this.agentService.run({
        thread,
        memory,
        message,
      });
      stream = await streamUtils.streamMessageOutputToGenerator(agentStream);
    }

    const source$ = from(stream).pipe(share());

    // 同时设置两个订阅，确保流共享
    this.transmitObservableToResponse(res, source$);
    this.saveMessageByObservable(thread, source$);

    source$.subscribe({
      complete: () => {
        res.end();
      },
      error: (error) => {
        this.logger.error('Error in chat', { error });
        res.end();
      },
    });
  }
  private async *streamMockSSE(): AsyncIterable<BaseMessageChunk> {
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
        const messageChunk = streamUtils.parseSSEMessage(
          line as `data: ${string}`,
        ) as { data: BaseMessage };
        if (messageChunk) {
          yield new AIMessageChunk(messageChunk.data.content.toString());
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (error) {
      this.logger.error('Failed to stream SSE from mock file', { error });
    }
  }
  private async saveMessageByObservable(
    thread: Thread,
    source$: Observable<BaseMessageChunk>,
  ) {
    let mergedMessage = new AIMessageChunk('');

    source$.subscribe({
      next: (messageChunk) => {
        mergedMessage = mergedMessage.concat(messageChunk);
      },
      error: (error) => {
        this.logger.error('Error in saveMessageByObservable', {
          error,
          threadUid: thread.uid,
        });
      },
      complete: async () => {
        try {
          await this.messageService.appendMessage(thread, [mergedMessage]);
          this.logger.info('Message saved successfully', {
            threadUid: thread.uid,
          });
        } catch (error) {
          this.logger.error('Failed to save message', {
            error,
            threadUid: thread.uid,
          });
        }
      },
    });
  }
  private transmitObservableToResponse(
    res: Response,
    source$: Observable<BaseMessageChunk>,
  ) {
    source$.subscribe({
      next: (messageChunk) => {
        try {
          const message = streamUtils.formatDataToSSE({
            role: messageChunk.response_metadata.role,
            content: messageChunk.content,
          });
          res.write(message);
        } catch (error) {
          this.logger.error('Error formatting message chunk', { error });
        }
      },
      error: (error) => {
        this.logger.error('Error in transportMessageToClient', { error });
        res.write(
          `data: ${JSON.stringify({ type: 'error', message: 'Stream error occurred' })}\n\n`,
        );
      },
      complete: () => {
        this.logger.info('Message stream completed');
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      },
    });
  }
}
