import { Body, Controller, Post, Req, Res, Sse, Get, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { StreamMessage } from './dto/sse-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: CreateChatDto,
  ) {
    const jwtPayload = req['jwt'];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive'); // 保持连接
    res.setHeader('Transfer-Encoding', 'chunked'); // 分块传输

    return this.chatService.chat(res, jwtPayload, body);
  }

  @Get('threads/restore')
  @Sse()
  async restoreThread(@Query('threadId') threadId: string): Promise<Observable<StreamMessage>> {
    return this.chatService.restoreThread(threadId);
  }
}
