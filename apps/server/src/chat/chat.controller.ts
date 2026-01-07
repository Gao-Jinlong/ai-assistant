import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto, RestoreChatDto } from './dto/create-chat.dto';
import { Request, Response } from 'express';

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

  @Post('restore')
  async restoreChat(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: RestoreChatDto,
  ) {
    const jwtPayload = req['jwt'];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive'); // 保持连接
    res.setHeader('Transfer-Encoding', 'chunked'); // 分块传输

    return this.chatService.restoreThread(res, jwtPayload, body);
  }
}
