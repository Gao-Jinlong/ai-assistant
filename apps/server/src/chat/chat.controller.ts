import { Body, Controller, Req, Res, Sse } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { Request, Response } from 'express';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Sse('message')
  async sseMessages(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: CreateChatDto,
  ) {
    const jwtPayload = req['jwt'];
    console.log('🚀 ~ ChatController ~ sseMessages ~ jwtPayload:', jwtPayload);

    return this.chatService.sseMessages(res, jwtPayload, body);
  }
}
