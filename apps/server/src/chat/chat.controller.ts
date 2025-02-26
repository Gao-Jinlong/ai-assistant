import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(
    @Body()
    body: {
      messages: { role: 'user' | 'assistant'; content: string }[];
    },
  ) {
    const response = await this.chatService.chat(body.messages);
    return { role: 'assistant', content: response };
  }
}
