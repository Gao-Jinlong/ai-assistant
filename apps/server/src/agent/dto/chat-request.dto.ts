import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z.string().describe('用户输入的消息'),
  threadId: z.string().describe('对话ID'),
});

export class ChatRequestDto extends createZodDto(chatRequestSchema) {}
