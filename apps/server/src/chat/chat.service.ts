import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@server/prisma/prisma.service';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CreateChatDto } from './dto/create-chat.dto';
import { MessageService } from '@server/message/message.service';
import { JwtPayload } from '@server/auth/auth.service';
import { AgentService } from '@server/agent/agent.service';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { ConfigService } from '@nestjs/config';
import { Thread } from '@prisma/client';
import { from, share, type Observable } from 'rxjs';
import { MESSAGE_TYPE } from './chat.interface';
import { MessageFormatterService } from './message-formatter.service';
import { MessageStreamProcessor } from './message-stream-processor';
import { SSEMessage } from './dto/sse-message.dto';
import { ErrorCode } from '@server/common/errors/error-codes';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly messageService: MessageService,
    private readonly agentService: AgentService,
    private readonly configService: ConfigService,
    private readonly messageFormatter: MessageFormatterService,
  ) {}

  async chat(res: Response, jwtPayload: JwtPayload, body: CreateChatDto) {
    const { threadUid, message } = body;
    const messageStreamProcessor = new MessageStreamProcessor(
      this.logger,
      this.messageFormatter,
    );

    const userMessage = new HumanMessage(message);

    const thread = await this.prisma.db.thread.findUnique({
      where: { uid: threadUid },
    });
    if (!thread) {
      throw new BadRequestException('Thread not found');
    }

    const memory = await this.messageService.getHistoryByThread(thread.uid);
    await this.messageService.appendMessage(thread, [userMessage]);

    try {
      const stream = await this.agentService.run({
        thread,
        memory,
        message: userMessage,
      });

      const processedStream = messageStreamProcessor.processStream(stream);

      // 处理统一格式的消息流
      await this.handleProcessedStream(processedStream, res, thread);
    } catch (error) {
      this.logger.error('Error in chat', { error, threadUid });

      const errorMessage = this.messageFormatter.formatError(
        error as Error,
        ErrorCode.INTERNAL_SERVER_ERROR,
        { threadUid },
      );

      res.write(this.messageFormatter.serializeToSSE(errorMessage));
      res.end();
    }
  }
  /**
   * 处理统一格式的消息流
   */
  private async handleProcessedStream(
    processedStream: AsyncGenerator<SSEMessage, void, unknown>,
    res: Response,
    thread: Thread,
  ) {
    const source$ = from(processedStream).pipe(share());

    this.saveMessageToDatabase(source$, thread);
    this.transmitMessageToClient(source$, res);
  }

  private async transmitMessageToClient(
    source$: Observable<SSEMessage>,
    res: Response,
  ) {
    source$.subscribe({
      next: (sseMessage) => {
        res.write(this.messageFormatter.serializeToSSE(sseMessage));
      },
    });
  }
  private saveMessageToDatabase(
    source$: Observable<SSEMessage>,
    thread: Thread,
  ) {
    let mergedMessage = '';
    source$.subscribe({
      next: (sseMessage) => {
        if (sseMessage.type === MESSAGE_TYPE.MESSAGE_CHUNK) {
          mergedMessage = mergedMessage.concat(sseMessage.data.content);
        }
      },
      complete: async () => {
        await this.messageService.appendMessage(thread, [
          new AIMessage(mergedMessage),
        ]);
      },
    });
  }
}
