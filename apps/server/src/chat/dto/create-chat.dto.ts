import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createChatSchema = z.object({
  threadId: z.string().describe('thread id'),
  content: z.string().describe('user message'),
});

// 从 createChatSchema 派生，只保留 threadId 字段
const restoreChatSchema = createChatSchema.pick({
  threadId: true,
});

export class CreateChatDto extends createZodDto(createChatSchema) {}
export class RestoreChatDto extends createZodDto(restoreChatSchema) {}
