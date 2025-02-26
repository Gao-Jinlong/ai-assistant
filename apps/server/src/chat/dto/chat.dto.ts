import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty({
    enum: ['user', 'assistant'],
    description: '消息角色',
    example: 'user',
  })
  role!: 'user' | 'assistant';

  @ApiProperty({
    description: '消息内容',
    example: '你好，请问你是谁？',
  })
  content!: string;
}

export class ChatRequestDto {
  @ApiProperty({
    type: [MessageDto],
    description: '聊天消息列表',
  })
  messages!: MessageDto[];
}

export class ChatResponseDto {
  @ApiProperty({
    enum: ['assistant'],
    description: '响应角色',
    example: 'assistant',
  })
  role!: 'assistant';

  @ApiProperty({
    description: 'AI 响应内容',
    example: '你好！我是 AI 助手，很高兴为你服务。',
  })
  content!: string;
}
