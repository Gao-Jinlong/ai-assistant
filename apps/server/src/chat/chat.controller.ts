import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';

@ApiTags('聊天')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: '发送聊天消息' })
  @ApiResponse({
    status: 200,
    description: 'AI 响应消息',
    type: ChatResponseDto,
  })
  async chat(@Body() body: ChatRequestDto) {
    const response = await this.chatService.chat(body.messages);
    return { role: 'assistant', content: response };
  }
}
