import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createChatSchema = z.object({
  threadId: z.string().describe('thread id'),
  content: z.string().describe('user message'),
});

export class CreateChatDto extends createZodDto(createChatSchema) {}
