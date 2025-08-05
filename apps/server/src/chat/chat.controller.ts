import { Body, Controller, Post, Req, Res, Sse } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
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

    return this.chatService.chat(res, jwtPayload, body);
  }
}
