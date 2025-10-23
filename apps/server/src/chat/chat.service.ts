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
  HumanMessage,
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
import { MESSAGE_TYPE } from './chat.interface';

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

    const userMessage = new HumanMessage(message);

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
        message: userMessage,
      });
      stream = await streamUtils.streamMessageOutputToGenerator(agentStream);
    }

    //  TODO 标准化返回消息的格式
    const source$ = from(stream).pipe(share());

    // stream 后续处理
    this.transmitObservableToResponse(source$, res);
    this.saveMessageByObservable(source$, thread);
    this.saveMessageToMockFile(source$);

    // 对话结束时，发送结束信号
    source$.subscribe({
      complete: () => {
        res.write(`data: ${JSON.stringify({ type: MESSAGE_TYPE.DONE })}\n\n`);
        res.end();
      },
      error: (error) => {
        this.logger.error('Error in chat', { error });
        res.write(
          `data: ${JSON.stringify({ type: MESSAGE_TYPE.ERROR, message: 'Error in chat service' })}\n\n`,
        );
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
  private async saveMessageToMockFile(source$: Observable<BaseMessageChunk>) {
    try {
      const mockPath = this.configService.get('mock.path') ?? './mock';
      const filePath = path.join(mockPath, 'chat.txt');
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '');
      }
      const writeStream = fs.createWriteStream(filePath, { encoding: 'utf-8' });

      source$.subscribe({
        next: (messageChunk) => {
          writeStream.write(JSON.stringify(messageChunk) + '\n');
        },
        complete: () => {
          writeStream.end();
        },
      });
    } catch (error) {
      this.logger.error('Failed to save message to mock file', {
        error,
      });
    }
  }
  private async saveMessageByObservable(
    source$: Observable<BaseMessageChunk>,
    thread: Thread,
  ) {
    let mergedMessage = new AIMessageChunk('');

    source$.subscribe({
      next: (messageChunk) => {
        mergedMessage = mergedMessage.concat(messageChunk as AIMessageChunk);
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
    source$: Observable<BaseMessageChunk>,
    res: Response,
  ) {
    source$.subscribe({
      next: (messageChunk) => {
        try {
          const message = streamUtils.formatDataToSSE({
            type: MESSAGE_TYPE.MESSAGE_CHUNK,
            content: messageChunk.content,
          });
          res.write(message);
        } catch (error) {
          this.logger.error('Error formatting message chunk', { error });
          res.write(
            `data: ${JSON.stringify({ type: MESSAGE_TYPE.ERROR, message: 'Error formatting message chunk' })}\n\n`,
          );
        }
      },
    });
  }
}
